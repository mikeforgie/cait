'use client';

import React, { useState } from 'react';
import {
  X,
  Server,
  User,
  Key,
  Folder,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Shield,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type ConnectionType = 'ftp' | 'sftp' | 'cpanel';

interface HostingConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (data: {
    connectionType: ConnectionType;
    host: string;
    port: number;
    username: string;
    password: string;
    rootPath: string;
  }) => Promise<{ success: boolean; error?: string }>;
  clientDomain?: string;
}

const connectionTypes: {
  id: ConnectionType;
  name: string;
  description: string;
  defaultPort: number;
  icon: React.ReactNode;
}[] = [
  {
    id: 'sftp',
    name: 'SFTP',
    description: 'Secure FTP over SSH (recommended)',
    defaultPort: 22,
    icon: <Shield className="w-5 h-5 text-green-600" />,
  },
  {
    id: 'ftp',
    name: 'FTP',
    description: 'Standard FTP connection',
    defaultPort: 21,
    icon: <Server className="w-5 h-5 text-blue-600" />,
  },
  {
    id: 'cpanel',
    name: 'cPanel',
    description: 'cPanel File Manager API',
    defaultPort: 2083,
    icon: <Folder className="w-5 h-5 text-orange-600" />,
  },
];

export function HostingConnectionModal({
  isOpen,
  onClose,
  onConnect,
  clientDomain
}: HostingConnectionModalProps) {
  const [step, setStep] = useState<'type' | 'form' | 'testing' | 'success' | 'error'>('type');
  const [connectionType, setConnectionType] = useState<ConnectionType>('sftp');
  const [host, setHost] = useState(clientDomain || '');
  const [port, setPort] = useState(22);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rootPath, setRootPath] = useState('/public_html');
  const [error, setError] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  const selectedType = connectionTypes.find(t => t.id === connectionType);

  // Instructions for each connection type
  const getInstructions = (type: ConnectionType) => {
    switch (type) {
      case 'sftp':
        return {
          title: 'How to find your SFTP credentials',
          steps: [
            'Log in to your hosting control panel (cPanel, Plesk, etc.)',
            'Look for "FTP Accounts" or "SFTP Access" section',
            'If no SFTP account exists, create one with full access',
            'The host is usually your domain or ftp.yourdomain.com',
            'Port 22 is standard for SFTP (SSH)',
            'Use the username and password you created',
          ],
          providers: [
            { name: 'GoDaddy', url: 'https://www.godaddy.com/help/connect-to-my-hosting-with-sftp-36731' },
            { name: 'Bluehost', url: 'https://www.bluehost.com/help/article/sftp-ssh-access' },
            { name: 'SiteGround', url: 'https://www.siteground.com/kb/how-to-manage-sftp-users/' },
            { name: 'HostGator', url: 'https://www.hostgator.com/help/article/how-do-i-connect-via-sftp' },
          ]
        };
      case 'ftp':
        return {
          title: 'How to find your FTP credentials',
          steps: [
            'Log in to your hosting control panel',
            'Navigate to "FTP Accounts" or "File Manager"',
            'Your FTP credentials may be in a welcome email from your host',
            'The host is typically ftp.yourdomain.com',
            'Port 21 is standard for FTP',
            'Create a new FTP account if needed',
          ],
          providers: [
            { name: 'GoDaddy', url: 'https://www.godaddy.com/help/find-my-ftp-username-and-password-277' },
            { name: 'Bluehost', url: 'https://www.bluehost.com/help/article/ftp-setup' },
            { name: 'DreamHost', url: 'https://help.dreamhost.com/hc/en-us/articles/115000675027-FTP-overview-and-credentials' },
          ]
        };
      case 'cpanel':
        return {
          title: 'How to connect via cPanel',
          steps: [
            'Log in to your cPanel (usually yourdomain.com/cpanel or yourdomain.com:2083)',
            'Your cPanel username and password are your credentials',
            'The host is your domain name',
            'Port 2083 is standard for cPanel (HTTPS)',
            'Make sure "Remote MySQL" access is enabled if needed',
          ],
          providers: [
            { name: 'cPanel Docs', url: 'https://docs.cpanel.net/' },
            { name: 'Bluehost cPanel', url: 'https://www.bluehost.com/help/article/cpanel-login-info' },
            { name: 'HostGator cPanel', url: 'https://www.hostgator.com/help/article/how-to-access-cpanel' },
          ]
        };
    }
  };

  const handleTypeSelect = (type: ConnectionType) => {
    setConnectionType(type);
    setPort(connectionTypes.find(t => t.id === type)?.defaultPort || 21);
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep('testing');

    try {
      const result = await onConnect({
        connectionType,
        host,
        port,
        username,
        password,
        rootPath,
      });

      if (result.success) {
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
    setStep('type');
    setError('');
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Server className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Connect Hosting</h2>
              <p className="text-sm text-gray-600">
                FTP/SFTP access for file deployment
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
          {step === 'type' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Select your connection type. SFTP is recommended for security.
              </p>

              {/* What this enables */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-green-600" />
                  What this enables
                </h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    Deploy robots.txt to site root
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    Deploy XML sitemaps
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    Modify .htaccess for redirects
                  </li>
                </ul>
              </div>

              {connectionTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all text-left flex items-center gap-4"
                >
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {type.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{type.name}</h3>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                  <span className="text-xs text-gray-500">Port {type.defaultPort}</span>
                </button>
              ))}

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    <strong>Where to find credentials:</strong> Check your hosting provider&apos;s control panel (cPanel, Plesk, etc.) for FTP/SFTP credentials.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('type')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    ← Change type
                  </button>
                  <span className="text-sm text-gray-500">|</span>
                  <span className="text-sm font-medium text-gray-700">
                    {selectedType?.name} Connection
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <HelpCircle className="w-4 h-4" />
                  How do I find this?
                </button>
              </div>

              {/* Instructions Accordion */}
              {showInstructions && selectedType && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                    {getInstructions(selectedType.id)?.title}
                  </h4>
                  <ol className="space-y-2 mb-4">
                    {getInstructions(selectedType.id)?.steps.map((step, index) => (
                      <li key={index} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-semibold flex items-center justify-center text-xs">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="border-t border-blue-200 pt-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Hosting provider guides:</p>
                    <div className="flex flex-wrap gap-2">
                      {getInstructions(selectedType.id)?.providers.map((provider, index) => (
                        <a
                          key={index}
                          href={provider.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 bg-white px-2 py-1 rounded border border-blue-200"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {provider.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Host */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Host / Server
                </label>
                <div className="relative">
                  <Server className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder={connectionType === 'cpanel' ? 'example.com:2083' : 'ftp.example.com'}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Port */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Port
                </label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(parseInt(e.target.value) || selectedType?.defaultPort || 21)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ftpuser"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Root Path */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website Root Path
                </label>
                <div className="relative">
                  <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={rootPath}
                    onChange={(e) => setRootPath(e.target.value)}
                    placeholder="/public_html"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Common paths: /public_html, /www, /htdocs, /var/www/html
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white py-3"
              >
                Test Connection
              </Button>
            </form>
          )}

          {step === 'testing' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">Testing Connection</h3>
              <p className="text-sm text-gray-600 mt-2">
                Connecting to {host}:{port}...
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
                  {selectedType?.name} connection established to {host}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Connection Details</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Type:</dt>
                    <dd className="font-medium text-gray-900">{selectedType?.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Host:</dt>
                    <dd className="font-medium text-gray-900">{host}:{port}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Root Path:</dt>
                    <dd className="font-medium text-gray-900">{rootPath}</dd>
                  </div>
                </dl>
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
                <h4 className="font-semibold text-gray-900 mb-2">Troubleshooting</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Verify your FTP/SFTP credentials in your hosting control panel</li>
                  <li>• Check if your IP is whitelisted (some hosts block unknown IPs)</li>
                  <li>• Make sure the port is correct ({selectedType?.defaultPort} is default for {selectedType?.name})</li>
                  <li>• Try SFTP if FTP doesn&apos;t work (more hosts support it)</li>
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
