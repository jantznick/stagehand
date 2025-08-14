import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

export default function BulkUploadForm({ onUpload }) {
  const onDrop = useCallback(acceptedFiles => {
    // Do something with the files
    onUpload(acceptedFiles[0]);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2 text-gray-400">
        <UploadCloud size={48} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag 'n' drop a CSV file here, or click to select a file</p>
        )}
      </div>
      <a href="/path/to/template.csv" download className="mt-4 text-blue-400 hover:text-blue-300 text-sm">
        Download CSV Template
      </a>
    </div>
  );
}