'use client';

import { useState } from 'react';

export default function Status() {
  const [applicationId, setApplicationId] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const mockStatus = {
    status: 'In Progress',
    stage: 'Document Verification',
    lastUpdate: '2023-12-01',
    nextSteps: 'Interview Scheduling',
    timeline: [
      { date: '2023-11-15', event: 'Application Submitted' },
      { date: '2023-11-20', event: 'Initial Review' },
      { date: '2023-12-01', event: 'Document Verification' }
    ]
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setStatus(mockStatus);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Visa Status Tracker</h1>
          <p className="text-lg text-gray-600">Track your visa application progress in real-time</p>
        </div>

        <form onSubmit={handleTrack} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              placeholder="Enter your application ID"
              className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? 'Tracking...' : 'Track Status'}
            </button>
          </div>
        </form>

        {status && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Current Status</h3>
                <p className="mt-1 text-lg font-semibold text-indigo-600">{status.status}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Current Stage</h3>
                <p className="mt-1 text-lg font-semibold text-gray-900">{status.stage}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                <p className="mt-1 text-lg font-semibold text-gray-900">{status.lastUpdate}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Next Steps</h3>
                <p className="mt-1 text-lg font-semibold text-gray-900">{status.nextSteps}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Application Timeline</h3>
              <div className="flow-root">
                <ul className="-mb-8">
                  {status.timeline.map((item, index) => (
                    <li key={index} className="relative pb-8">
                      {index !== status.timeline.length - 1 && (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center ring-8 ring-white">
                            <span className="h-2.5 w-2.5 rounded-full bg-white" />
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-gray-500">{item.event}</p>
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-gray-500">
                            <time dateTime={item.date}>{item.date}</time>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}