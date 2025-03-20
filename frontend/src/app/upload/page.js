'use client';

import { useState } from 'react';

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (newFiles) => {
    setFiles(prevFiles => [
      ...prevFiles,
      ...Array.from(newFiles).map(file => ({
        file,
        id: Math.random().toString(36).substring(7),
        progress: 0,
        status: 'pending'
      }))
    ]);
  };

  const handleUpload = async () => {
    setUploading(true);
    
    // Simulate file upload with progress
    for (let fileData of files) {
      if (fileData.status === 'pending') {
        for (let progress = 0; progress <= 100; progress += 10) {
          setFiles(prevFiles =>
            prevFiles.map(f =>
              f.id === fileData.id
                ? { ...f, progress, status: progress === 100 ? 'completed' : 'uploading' }
                : f
            )
          );
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
    
    setUploading(false);
  };

  const removeFile = (fileId) => {
    setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Document Upload</h1>
          <p className="text-lg text-gray-600">Upload your immigration documents securely</p>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-12 text-center ${
            dragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            onChange={handleChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Choose Files
          </label>
          <p className="mt-2 text-sm text-gray-600">
            or drag and drop your files here
          </p>
        </div>

        {files.length > 0 && (
          <div className="mt-8">
            <div className="space-y-4">
              {files.map((fileData) => (
                <div
                  key={fileData.id}
                  className="bg-white shadow rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {fileData.file.name}
                      </span>
                      <button
                        onClick={() => removeFile(fileData.id)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <span className="sr-only">Remove</span>
                        ×
                      </button>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          fileData.status === 'completed'
                            ? 'bg-green-500'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${fileData.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {fileData.status === 'completed'
                      ? 'Completed'
                      : `${fileData.progress}%`}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={handleUpload}
                disabled={uploading || files.every(f => f.status === 'completed')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload All'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}