'use client';

import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Copy, Download, ExternalLink, FileText, Bot, Upload, Loader2, Globe, Server, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AutomationResult {
  success: boolean;
  taskId: string;
  action: string;
  message: string;
  details?: {
    status?: string;
    existingRobots?: string;
    optimizedRobots?: string;
    recommendations?: string[];
    issues?: string[];
    nextSteps?: string[];
    pagesDiscovered?: number;
    pages?: string[];
    sitemapXml?: string;
    gscStatus?: string;
    [key: string]: any;
  };
  error?: string;
}

interface ConnectionStatus {
  wordpress?: {
    connected: boolean;
    siteName?: string;
  };
  hosting?: {
    connected: boolean;
    type?: string;
    host?: string;
  };
}

interface AutomationResultModalProps {
  result: AutomationResult | null;
  isOpen: boolean;
  onClose: () => void;
  clientId?: string;
  connectionStatus?: ConnectionStatus;
  onDeploy?: (type: 'robots' | 'sitemap', content: string) => Promise<{ success: boolean; error?: string }>;
}

export function AutomationResultModal({
  result,
  isOpen,
  onClose,
  clientId,
  connectionStatus,
  onDeploy
}: AutomationResultModalProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen || !result) return null;

  const hasWordPress = connectionStatus?.wordpress?.connected;
  const hasHosting = connectionStatus?.hosting?.connected;
  const canDeploy = hasWordPress || hasHosting;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeploy = async (type: 'robots' | 'sitemap', content: string) => {
    if (!onDeploy) return;

    setIsDeploying(true);
    setDeployResult(null);

    try {
      const deployResultData = await onDeploy(type, content);
      setDeployResult({
        success: deployResultData.success,
        message: deployResultData.success
          ? `Successfully deployed ${type === 'robots' ? 'robots.txt' : 'sitemap.xml'} to your site!`
          : deployResultData.error || 'Deployment failed'
      });
    } catch (error) {
      setDeployResult({
        success: false,
        message: error instanceof Error ? error.message : 'Deployment failed'
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`flex items-start justify-between p-6 border-b ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3">
            {result.success ? (
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            ) : (
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {result.success ? 'Automation Complete' : 'Automation Failed'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{result.message}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Deploy Result */}
          {deployResult && (
            <div className={`p-4 rounded-lg ${deployResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2">
                {deployResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <p className={`text-sm font-medium ${deployResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {deployResult.message}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {result.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{result.error}</p>
            </div>
          )}

          {/* Issues Found */}
          {result.details?.issues && result.details.issues.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                Issues Found
              </h3>
              <ul className="space-y-1">
                {result.details.issues.map((issue, index) => (
                  <li key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {result.details?.recommendations && result.details.recommendations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-500" />
                Recommendations
              </h3>
              <ul className="space-y-1">
                {result.details.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-purple-700 bg-purple-50 p-2 rounded flex items-start gap-2">
                    <span className="text-purple-400">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Generated robots.txt */}
          {result.details?.optimizedRobots && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Generated robots.txt
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(result.details!.optimizedRobots!, 'robots.txt')}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(result.details!.optimizedRobots!, 'robots.txt')}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto max-h-48">
                {result.details.optimizedRobots}
              </pre>

              {/* Deploy Section for robots.txt */}
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                {canDeploy ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {hasWordPress ? (
                        <Globe className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Server className="w-5 h-5 text-orange-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Deploy to {hasWordPress ? connectionStatus?.wordpress?.siteName || 'WordPress' : connectionStatus?.hosting?.host || 'Server'}
                        </p>
                        <p className="text-xs text-gray-600">
                          Upload robots.txt directly to your site
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDeploy('robots', result.details!.optimizedRobots!)}
                      disabled={isDeploying}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      {isDeploying ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deploying...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Deploy to Site
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Connect WordPress or Hosting to auto-deploy
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Go to Connections to set up WordPress or FTP/SFTP access, then CAIT can deploy files automatically.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Generated sitemap */}
          {result.details?.sitemapXml && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Generated sitemap.xml ({result.details.pagesDiscovered || 0} pages)
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(result.details!.sitemapXml!, 'sitemap.xml')}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(result.details!.sitemapXml!, 'sitemap.xml')}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto max-h-48">
                {result.details.sitemapXml}
              </pre>

              {/* Deploy Section for sitemap */}
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                {canDeploy ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {hasWordPress ? (
                        <Globe className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Server className="w-5 h-5 text-orange-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Deploy to {hasWordPress ? connectionStatus?.wordpress?.siteName || 'WordPress' : connectionStatus?.hosting?.host || 'Server'}
                        </p>
                        <p className="text-xs text-gray-600">
                          Upload sitemap.xml directly to your site
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDeploy('sitemap', result.details!.sitemapXml!)}
                      disabled={isDeploying}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      {isDeploying ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deploying...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Deploy to Site
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Connect WordPress or Hosting to auto-deploy
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Go to Connections to set up WordPress or FTP/SFTP access, then CAIT can deploy files automatically.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pages Discovered */}
          {result.details?.pages && result.details.pages.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Pages Discovered ({result.details.pages.length})
              </h3>
              <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                {result.details.pages.map((page, index) => (
                  <a
                    key={index}
                    href={page}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-blue-600 hover:underline py-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {page}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* GSC Status */}
          {result.details?.gscStatus && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">{result.details.gscStatus}</p>
            </div>
          )}

          {/* Next Steps */}
          {result.details?.nextSteps && result.details.nextSteps.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Next Steps
              </h3>
              <ol className="space-y-2">
                {result.details.nextSteps.map((step, index) => (
                  <li key={index} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 font-semibold flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
