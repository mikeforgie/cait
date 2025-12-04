'use client';

import React, { useState } from 'react';
import {
  X,
  Globe,
  User,
  Key,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  AlertCircle,
  FileCode,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAppPasswordInstructions } from '@/lib/integrations/wordpress';

interface WordPressConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (data: {
    siteUrl: string;
    username: string;
    appPassword: string;
  }) => Promise<{ success: boolean; error?: string; siteInfo?: any }>;
  clientDomain?: string;
}

export function WordPressConnectionModal({
  isOpen,
  onClose,
  onConnect,
  clientDomain
}: WordPressConnectionModalProps) {
  const [step, setStep] = useState<'form' | 'testing' | 'success' | 'error'>('form');
  const [siteUrl, setSiteUrl] = useState(clientDomain ? `https://${clientDomain}` : '');
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [error, setError] = useState('');
  const [siteInfo, setSiteInfo] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const instructions = getAppPasswordInstructions(siteUrl || 'https://yoursite.com');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep('testing');

    try {
      const result = await onConnect({
        siteUrl: siteUrl.replace(/\/$/, ''),
        username,
        appPassword: appPassword.replace(/\s/g, ''), // Remove spaces from password
      });

      if (result.success) {
        setSiteInfo(result.siteInfo);
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
    setSiteInfo(null);
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Connect WordPress</h2>
              <p className="text-sm text-gray-600">
                Enable AI-powered file deployment
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
              <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-green-600" />
                  What this enables
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    Deploy robots.txt automatically
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    Deploy XML sitemaps
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    Update meta tags and schema markup
                  </li>
                </ul>
              </div>

              {/* Site URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WordPress Site URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WordPress Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Application Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Application Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    How do I get this?
                  </button>
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  This is NOT your WordPress login password. It&apos;s a special Application Password.
                </p>
              </div>

              {/* Instructions Accordion */}
              {showInstructions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-600" />
                    How to create an Application Password
                  </h4>
                  <ol className="space-y-2">
                    {instructions.map((instruction, index) => (
                      <li key={index} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-semibold flex items-center justify-center text-xs">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 pt-0.5">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                  {siteUrl && (
                    <a
                      href={`${siteUrl.replace(/\/$/, '')}/wp-admin/profile.php`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open WordPress Profile Page
                    </a>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3"
              >
                Test Connection
              </Button>
            </form>
          )}

          {step === 'testing' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">Testing Connection</h3>
              <p className="text-sm text-gray-600 mt-2">
                Connecting to {siteUrl}...
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
                  WordPress connection established
                </p>
              </div>

              {siteInfo && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Site Information</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Site Name:</dt>
                      <dd className="font-medium text-gray-900">{siteInfo.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">URL:</dt>
                      <dd className="font-medium text-gray-900">{siteInfo.url}</dd>
                    </div>
                    {siteInfo.version && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">WordPress:</dt>
                        <dd className="font-medium text-gray-900">{siteInfo.version}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

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
                  <li>• Make sure you&apos;re using an Application Password, not your login password</li>
                  <li>• WordPress 5.6+ is required for Application Passwords</li>
                  <li>• Some security plugins may block the REST API</li>
                  <li>• Check that the site URL is correct and accessible</li>
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
