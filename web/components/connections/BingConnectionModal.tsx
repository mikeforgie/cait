'use client';

import React, { useState } from 'react';
import {
  X,
  Globe,
  Key,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  AlertCircle,
  TrendingUp,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BingConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (data: {
    apiKey: string;
    siteUrl: string;
  }) => Promise<{ success: boolean; error?: string; availableSites?: string[] }>;
  clientDomain?: string;
}

export function BingConnectionModal({
  isOpen,
  onClose,
  onConnect,
  clientDomain
}: BingConnectionModalProps) {
  const [step, setStep] = useState<'form' | 'testing' | 'success' | 'error'>('form');
  const [siteUrl, setSiteUrl] = useState(clientDomain ? `https://${clientDomain}` : '');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [availableSites, setAvailableSites] = useState<string[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep('testing');

    try {
      const result = await onConnect({
        apiKey: apiKey.trim(),
        siteUrl: siteUrl.replace(/\/$/, ''),
      });

      if (result.success) {
        setStep('success');
      } else {
        setError(result.error || 'Connection failed');
        if (result.availableSites) {
          setAvailableSites(result.availableSites);
        }
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
    setAvailableSites([]);
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Connect Bing Webmaster Tools</h2>
              <p className="text-sm text-gray-600">
                Access Bing search data and insights
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
              {/* What this enables */}
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4 text-teal-600" />
                  What this enables
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    View Bing search rankings and impressions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    Track click-through rates from Bing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    Monitor indexing status on Bing
                  </li>
                </ul>
              </div>

              {/* Site URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  This must match a verified site in your Bing Webmaster Tools account
                </p>
              </div>

              {/* API Key */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Bing Webmaster API Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    How do I get this?
                  </button>
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Bing API key"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono"
                  />
                </div>
              </div>

              {/* Instructions Accordion */}
              {showInstructions && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Key className="w-4 h-4 text-teal-600" />
                    How to get your Bing API Key
                  </h4>
                  <ol className="space-y-2">
                    <li className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-600 font-semibold flex items-center justify-center text-xs">
                        1
                      </span>
                      <span className="text-gray-700 pt-0.5">
                        Go to Bing Webmaster Tools and sign in
                      </span>
                    </li>
                    <li className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-600 font-semibold flex items-center justify-center text-xs">
                        2
                      </span>
                      <span className="text-gray-700 pt-0.5">
                        Click the gear icon (Settings) in the top right
                      </span>
                    </li>
                    <li className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-600 font-semibold flex items-center justify-center text-xs">
                        3
                      </span>
                      <span className="text-gray-700 pt-0.5">
                        Select &quot;API access&quot; from the menu
                      </span>
                    </li>
                    <li className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-600 font-semibold flex items-center justify-center text-xs">
                        4
                      </span>
                      <span className="text-gray-700 pt-0.5">
                        Click &quot;Generate&quot; to create a new API key
                      </span>
                    </li>
                    <li className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-600 font-semibold flex items-center justify-center text-xs">
                        5
                      </span>
                      <span className="text-gray-700 pt-0.5">
                        Copy the API key and paste it above
                      </span>
                    </li>
                  </ol>
                  <a
                    href="https://www.bing.com/webmasters"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Bing Webmaster Tools
                  </a>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white py-3"
              >
                Connect Bing Webmaster Tools
              </Button>
            </form>
          )}

          {step === 'testing' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">Validating API Key</h3>
              <p className="text-sm text-gray-600 mt-2">
                Connecting to Bing Webmaster Tools...
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
                  Bing Webmaster Tools is now connected for {siteUrl}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">What&apos;s Next</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Bing search data will sync automatically
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    View rankings in the Analytics dashboard
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

              {availableSites.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Your Verified Sites</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    The site URL you entered isn&apos;t verified. Choose one of your verified sites:
                  </p>
                  <ul className="text-sm space-y-1">
                    {availableSites.map((site, index) => (
                      <li key={index}>
                        <button
                          onClick={() => {
                            setSiteUrl(site);
                            setStep('form');
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {site}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Common Issues</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>Make sure the API key is correct and not expired</li>
                  <li>The site must be verified in Bing Webmaster Tools</li>
                  <li>Check that the site URL matches exactly (including https://)</li>
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
