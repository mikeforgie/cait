'use client';

import React, { useState } from 'react';
import {
  X,
  Key,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  AlertCircle,
  MousePointer,
  Hash,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClarityConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (data: {
    apiToken: string;
    projectId: string;
  }) => Promise<{ success: boolean; error?: string; warning?: string; remainingRequests?: number }>;
  clientDomain?: string;
}

export function ClarityConnectionModal({
  isOpen,
  onClose,
  onConnect,
  clientDomain
}: ClarityConnectionModalProps) {
  const [step, setStep] = useState<'form' | 'testing' | 'success' | 'error'>('form');
  const [projectId, setProjectId] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setWarning('');
    setStep('testing');

    try {
      const result = await onConnect({
        apiToken: apiToken.trim(),
        projectId: projectId.trim(),
      });

      if (result.success) {
        if (result.warning) {
          setWarning(result.warning);
        }
        if (result.remainingRequests !== undefined) {
          setRemainingRequests(result.remainingRequests);
        }
        setStep('success');
      } else {
        setError(result.error || 'Connection failed');
        setStep('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('form');
    setError('');
    setWarning('');
    setRemainingRequests(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MousePointer className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Connect Microsoft Clarity</h2>
              <p className="text-sm text-gray-600">
                Access heatmaps and session recordings
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* API Rate Limit Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-800">Important: API Rate Limit</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Microsoft Clarity allows only <strong>10 API requests per day</strong> per project.
                      We&apos;ll use 1 request to verify your connection.
                    </p>
                  </div>
                </div>
              </div>

              {/* What this enables */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <MousePointer className="w-4 h-4 text-purple-600" />
                  What this enables
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    View heatmaps showing where users click
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    Access session recordings to understand user behavior
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    Get insights on rage clicks and dead clicks
                  </li>
                </ul>
              </div>

              {/* Project ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clarity Project ID
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="e.g., abc123xyz"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Found in your Clarity dashboard URL: clarity.ms/project/[PROJECT_ID]
                </p>
              </div>

              {/* API Token */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Clarity API Token
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    How do I get this?
                  </button>
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="Enter your Clarity API token"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                  />
                </div>
              </div>

              {/* Instructions Accordion */}
              {showInstructions && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Key className="w-4 h-4 text-purple-600" />
                    How to get your Clarity API Token
                  </h4>
                  <ol className="space-y-2">
                    <li className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 font-semibold flex items-center justify-center text-xs">
                        1
                      </span>
                      <span className="text-gray-700 pt-0.5">
                        Go to Microsoft Clarity and open your project
                      </span>
                    </li>
                    <li className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 font-semibold flex items-center justify-center text-xs">
                        2
                      </span>
                      <span className="text-gray-700 pt-0.5">
                        Click <strong>Data export</strong> in the left sidebar (arrow icon)
                      </span>
                    </li>
                    <li className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 font-semibold flex items-center justify-center text-xs">
                        3
                      </span>
                      <span className="text-gray-700 pt-0.5">
                        Click <strong>Generate new API token</strong>
                      </span>
                    </li>
                    <li className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 font-semibold flex items-center justify-center text-xs">
                        4
                      </span>
                      <span className="text-gray-700 pt-0.5">
                        Give your token a name (4-32 characters)
                      </span>
                    </li>
                    <li className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 font-semibold flex items-center justify-center text-xs">
                        5
                      </span>
                      <span className="text-gray-700 pt-0.5">
                        Copy the token and paste it above
                      </span>
                    </li>
                  </ol>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Tip:</strong> Your Project ID is shown at the top of the Overview page (e.g., <strong>pexr5tq79z</strong>)
                    </p>
                  </div>
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> You must be a project administrator to generate API tokens.
                    </p>
                  </div>
                  <a
                    href="https://clarity.microsoft.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Microsoft Clarity
                  </a>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3"
              >
                Connect Microsoft Clarity
              </Button>
            </form>
          )}

          {step === 'testing' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">Validating API Token</h3>
              <p className="text-sm text-gray-600 mt-2">
                Connecting to Microsoft Clarity...
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Connected Successfully!</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Microsoft Clarity is now connected
                </p>
              </div>

              {warning && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-800">Rate Limit Reminder</h4>
                      <p className="text-sm text-amber-700 mt-1">{warning}</p>
                      {remainingRequests !== null && (
                        <p className="text-sm text-amber-700 mt-1">
                          <strong>Remaining requests today:</strong> {remainingRequests}/10
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">What&apos;s Next</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    View heatmaps and session data in the Analytics dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    AI will use Clarity insights for UX recommendations
                  </li>
                </ul>
              </div>

              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          )}

          {step === 'error' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-red-100 rounded-full mb-4">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Connection Failed</h3>
                <p className="text-sm text-red-600 mt-2">{error}</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Common Issues</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>Make sure the API token is correct and not expired</li>
                  <li>You must be a project administrator to use the API</li>
                  <li>Check if you&apos;ve exceeded the 10 requests/day limit</li>
                  <li>Ensure the project ID matches your Clarity dashboard URL</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('form')}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
