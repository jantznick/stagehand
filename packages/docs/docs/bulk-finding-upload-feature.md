# Feature Guide: Bulk Finding Upload

This guide explains how to use the bulk upload feature to import multiple security findings into a project from a CSV file.

## Who can use this feature?

To use the bulk upload feature, you must have an **Admin** or **Editor** role on the project you wish to upload findings to. Users with the `Reader` role will not see the bulk upload option.

## How to Upload Findings

1.  **Navigate to a Project:** From the main dashboard, select the project you want to add findings to.

2.  **Open the "Add Finding" Modal:** Click the "Add Finding" button.

3.  **Select Bulk Upload:** In the modal, you will see two options: "Manual Entry" and "Bulk Upload". Click on "Bulk Upload".

4.  **Download the Template:** To ensure your data is in the correct format, click the "Download CSV Template" link.

5.  **Prepare Your CSV File:** Open the downloaded template and fill in the finding details. The required columns are:
    *   `title`: The title of the vulnerability.
    *   `description`: A detailed description of the vulnerability.
    *   `severity`: The severity of the vulnerability. Must be one of `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, or `INFO`.
    *   `cveId`: The CVE identifier for the vulnerability (e.g., `CVE-2021-44228`).

6.  **Upload Your File:** Drag and drop your completed CSV file onto the upload area, or click to browse and select the file from your computer.

7.  **Monitor the Upload:**
    *   A "toast" notification will appear to confirm that the upload has started.
    *   The system will process the file in the background. This may take a few moments, depending on the size of your file.
    *   You will receive another notification once the process is complete.
    *   If any rows in your CSV file fail to import, a downloadable error report will be generated.

8.  **View Your Findings:** Once the import is successful, the findings list for the project will automatically refresh to display the newly imported findings.