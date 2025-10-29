import passport from 'passport';
import { Strategy as OidcStrategy } from 'passport-openidconnect';
import { PrismaClient } from '@prisma/client';
import { decrypt } from './crypto.js';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// This function will act as a middleware to dynamically create 
// and configure the OIDC strategy based on the incoming request.
export const dynamicOidcStrategy = async (req, res, next) => {
  try {
    let oidcConfig;
    let organizationId;

    // IdP-initiated flow: The IdP will POST a token to our callback URL.
    // We need to decode the token to find the issuer and look up the config.
    if (req.body && req.body.id_token) {
      const decodedToken = jwt.decode(req.body.id_token);
      if (!decodedToken || !decodedToken.iss) {
        return res.status(400).send('Invalid token or issuer not found.');
      }
      oidcConfig = await prisma.oIDCConfiguration.findUnique({
        where: { issuer: decodedToken.iss },
      });
      if (oidcConfig) {
        organizationId = oidcConfig.organizationId;
      }
    } 
    // The instance resolver has already identified the organization.
    else if (req.organization) {
      organizationId = req.organization.id;
      oidcConfig = await prisma.oIDCConfiguration.findUnique({
        where: { organizationId: organizationId },
      });
    }

    if (!oidcConfig) {
      // If we are on an instance domain but there's no config, it's an error.
      if (req.organization) {
        return res.status(404).send('OIDC is not configured for this organization.');
      }
      // Otherwise, just continue, this might not be an OIDC request.
      return next();
    }

    // Store the organizationId in the session to be used in the callback
    if (organizationId) {
      req.session.oidc = { organizationId };
    }

    const decryptedSecret = decrypt(oidcConfig.clientSecret);

    const strategyOptions = {
      issuer: oidcConfig.issuer,
      clientID: oidcConfig.clientId,
      clientSecret: decryptedSecret,
      callbackURL: `${process.env.API_URL}/api/v1/auth/oidc/callback`,
      scope: 'openid profile email',
      passReqToCallback: true,
    };

    // If the URLs are manually provided, use them. Otherwise, let the library
    // discover them from the issuer's .well-known/openid-configuration endpoint.
    if (oidcConfig.authorizationUrl && oidcConfig.tokenUrl && oidcConfig.userInfoUrl) {
      strategyOptions.authorizationURL = oidcConfig.authorizationUrl;
      strategyOptions.tokenURL = oidcConfig.tokenUrl;
      strategyOptions.userInfoURL = oidcConfig.userInfoUrl;
    }

    const strategy = new OidcStrategy(
      strategyOptions,
      async (req, issuer, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] && profile.emails[0].value;
          if (!email) {
            return done(new Error('Email not found in OIDC profile'), null);
          }

          const orgId = req.session.oidc?.organizationId;
          if (!orgId) {
            // This could happen in a state-less IdP-initiated flow. 
            // We re-fetch the config using the issuer from the profile.
            const config = await prisma.oIDCConfiguration.findUnique({ where: { issuer: issuer }});
            if (!config) {
              return done(new Error(`OIDC configuration not found for issuer: ${issuer}`), null);
            }
            req.session.oidc = { organizationId: config.organizationId };
          }

          let user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            // JIT Provisioning
            const config = await prisma.oIDCConfiguration.findUnique({ where: { organizationId: req.session.oidc.organizationId } });
            user = await prisma.user.create({
              data: {
                email,
                emailVerified: true,
                memberships: {
                  create: {
                    role: config.defaultRole, // Use the configured default role
                    organizationId: req.session.oidc.organizationId,
                  },
                },
              },
            });
          } else {
            // Ensure user is part of the organization
            const membership = await prisma.membership.findFirst({
              where: {
                userId: user.id,
                organizationId: req.session.oidc.organizationId
              }
            });
            if (!membership) {
              // Add user to the org if they aren't already a member
              const config = await prisma.oIDCConfiguration.findUnique({ where: { organizationId: req.session.oidc.organizationId } });
              await prisma.membership.create({
                data: {
                  userId: user.id,
                  organizationId: req.session.oidc.organizationId,
                  role: config.defaultRole // Use the defaultRole from config
                }
              })
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    );
    
    // Attach the dynamically configured strategy to passport for this request
    passport.use('oidc', strategy);
    next();
  } catch (error) {
    console.error('OIDC Strategy Error:', error);
    return res.status(500).send('Internal server error during OIDC setup.');
  }
};

export default function configurePassport() {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      // The user object is now simple. All organization/feature data
      // is handled by the instanceResolver middleware and attached to req.organization.
      const user = await prisma.user.findUnique({
        where: { id },
      });
      
      if (user) {
        const { password, ...userWithoutPassword } = user;
        done(null, userWithoutPassword);
      } else {
        done(null, false);
      }
    } catch (err) {
      done(err);
    }
  });

  // OIDC strategy will be added here later
} 