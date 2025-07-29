import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';

export const setupGraphQL = async (app) => {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req }) => {
            return { user: req.user };
        },
    });

    await server.start();
    server.applyMiddleware({ app });

    console.log(`🚀 GraphQL server ready at http://localhost:4000${server.graphqlPath}`);
}; 