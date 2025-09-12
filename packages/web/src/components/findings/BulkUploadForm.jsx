import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';

export default function BulkUploadForm({ onUpload, isUploading }) {
  const [file, setFile] = useState(null);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
    disabled: !!file || isUploading,
  });

  const handleUpload = () => {
    if (file) {
      onUpload(file);
    }
  };

  const handleClear = () => {
    setFile(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        {...getRootProps()}
        className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-600 hover:border-gray-500'
        } ${!!file || isUploading ? 'cursor-not-allowed bg-gray-800/50' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <UploadCloud size={48} />
          {isDragActive ? (
            <p>Drop the file here ...</p>
          ) : (
            <p>Drag 'n' drop a CSV file here, or click to select a file</p>
          )}
        </div>
      </div>

      {file && !isUploading && (
        <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2">
            <FileIcon className="text-gray-400" />
            <span className="text-sm">{file.name}</span>
          </div>
          <button onClick={handleClear} className="p-1 text-gray-400 rounded-full hover:bg-gray-600 hover:text-white">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex flex-col items-center">
        <a href="/findings-template.csv" download className="mb-4 text-blue-400 hover:text-blue-300 text-sm">
          Download CSV Template
        </a>
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Upload Findings'}
        </button>
      </div>
    </div>
  );
}