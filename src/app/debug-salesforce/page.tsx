'use client';

import { useState } from 'react';

// TypeScript interfaces for debug responses
interface EnvironmentStatus {
  hasUsername: boolean;
  hasPassword: boolean;
  hasLoginUrl: boolean;
  loginUrl?: string;
  usernamePrefix?: string;
}

interface SalesforceAuthResponse {
  success: boolean;
  sessionId?: string;
  serverUrl?: string;
  error?: string;
  responseStatus?: number;
  responseText?: string;
}

interface LeadCreationResponse {
  success: boolean;
  leadId?: string;
  error?: string;
  responseStatus?: number;
  responseText?: string;
  leadData?: any;
}

interface DebugResponse {
  environment: EnvironmentStatus;
  authentication: SalesforceAuthResponse;
  leadCreation: LeadCreationResponse;
  timestamp: string;
  totalDuration: number;
}

const SalesforceDebugPage = () => {
  const [debugResult, setDebugResult] = useState<DebugResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDebugTest = async () => {
    setLoading(true);
    setError(null);
    setDebugResult(null);

    try {
      const response = await fetch('/api/debug-salesforce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || 'Unknown error'}`);
      }

      setDebugResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (success: boolean) => success ? 'text-green-600' : 'text-red-600';
  const getStatusIcon = (success: boolean) => success ? '✅' : '❌';

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            🔍 Salesforce Debug Dashboard
          </h1>
          
          <div className="mb-6">
            <button
              onClick={runDebugTest}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? '🔄 Running Debug Test...' : '🚀 Run Salesforce Debug Test'}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <strong>Error:</strong> {error}
            </div>
          )}

          {debugResult && (
            <div className="space-y-6">
              {/* Test Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">📊 Test Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Timestamp:</span><br />
                    {new Date(debugResult.timestamp).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span><br />
                    {debugResult.totalDuration}ms
                  </div>
                  <div>
                    <span className="font-medium">Environment:</span><br />
                    <span className={getStatusColor(debugResult.environment.hasUsername && debugResult.environment.hasPassword)}>
                      {getStatusIcon(debugResult.environment.hasUsername && debugResult.environment.hasPassword)} {debugResult.environment.hasUsername && debugResult.environment.hasPassword ? 'Ready' : 'Missing Vars'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Overall:</span><br />
                    <span className={getStatusColor(debugResult.leadCreation.success)}>
                      {getStatusIcon(debugResult.leadCreation.success)} {debugResult.leadCreation.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Environment Variables */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">🔧 Environment Variables</h2>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between">
                    <span>SALESFORCE_USERNAME:</span>
                    <span className={getStatusColor(debugResult.environment.hasUsername)}>
                      {getStatusIcon(debugResult.environment.hasUsername)} 
                      {debugResult.environment.hasUsername ? debugResult.environment.usernamePrefix : 'MISSING'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>SALESFORCE_PASSWORD:</span>
                    <span className={getStatusColor(debugResult.environment.hasPassword)}>
                      {getStatusIcon(debugResult.environment.hasPassword)} 
                      {debugResult.environment.hasPassword ? '••••••••' : 'MISSING'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>SALESFORCE_LOGIN_URL:</span>
                    <span className={getStatusColor(debugResult.environment.hasLoginUrl)}>
                      {getStatusIcon(debugResult.environment.hasLoginUrl)} 
                      {debugResult.environment.hasLoginUrl ? debugResult.environment.loginUrl : 'MISSING'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Authentication Results */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">🔐 Authentication Test</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <span className={getStatusColor(debugResult.authentication.success)}>
                      {getStatusIcon(debugResult.authentication.success)} 
                      {debugResult.authentication.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  {debugResult.authentication.sessionId && (
                    <div className="flex justify-between">
                      <span className="font-medium">Session ID Length:</span>
                      <span className="text-green-600">{debugResult.authentication.sessionId.length} chars</span>
                    </div>
                  )}
                  {debugResult.authentication.serverUrl && (
                    <div className="flex justify-between">
                      <span className="font-medium">Server URL:</span>
                      <span className="text-green-600 break-all">{debugResult.authentication.serverUrl}</span>
                    </div>
                  )}
                  {debugResult.authentication.error && (
                    <div className="mt-2">
                      <span className="font-medium text-red-600">Error:</span>
                      <pre className="mt-1 p-2 bg-red-100 rounded text-xs overflow-x-auto text-red-800">
                        {debugResult.authentication.error}
                      </pre>
                    </div>
                  )}
                  {debugResult.authentication.responseText && (
                    <div className="mt-2">
                      <span className="font-medium">Response:</span>
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto max-h-32">
                        {debugResult.authentication.responseText}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Lead Creation Results */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">👤 Lead Creation Test</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <span className={getStatusColor(debugResult.leadCreation.success)}>
                      {getStatusIcon(debugResult.leadCreation.success)} 
                      {debugResult.leadCreation.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  {debugResult.leadCreation.leadId && (
                    <div className="flex justify-between">
                      <span className="font-medium">Lead ID:</span>
                      <span className="text-green-600 font-mono">{debugResult.leadCreation.leadId}</span>
                    </div>
                  )}
                  {debugResult.leadCreation.responseStatus && (
                    <div className="flex justify-between">
                      <span className="font-medium">HTTP Status:</span>
                      <span className={debugResult.leadCreation.responseStatus < 400 ? 'text-green-600' : 'text-red-600'}>
                        {debugResult.leadCreation.responseStatus}
                      </span>
                    </div>
                  )}
                  {debugResult.leadCreation.error && (
                    <div className="mt-2">
                      <span className="font-medium text-red-600">Error:</span>
                      <pre className="mt-1 p-2 bg-red-100 rounded text-xs overflow-x-auto text-red-800">
                        {debugResult.leadCreation.error}
                      </pre>
                    </div>
                  )}
                  {debugResult.leadCreation.responseText && (
                    <div className="mt-2">
                      <span className="font-medium">Response:</span>
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto max-h-32">
                        {debugResult.leadCreation.responseText}
                      </pre>
                    </div>
                  )}
                  {debugResult.leadCreation.leadData && (
                    <div className="mt-2">
                      <span className="font-medium">Test Lead Data:</span>
                      <pre className="mt-1 p-2 bg-blue-100 rounded text-xs overflow-x-auto max-h-40">
                        {JSON.stringify(debugResult.leadCreation.leadData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Raw JSON */}
              <details className="bg-gray-50 p-4 rounded-lg">
                <summary className="cursor-pointer font-semibold text-gray-800 mb-2">
                  📄 Raw Debug Response (Click to expand)
                </summary>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                  {JSON.stringify(debugResult, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesforceDebugPage;