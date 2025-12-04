'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2,
  XCircle,
  Edit2,
  Save,
  Copy,
  ExternalLink,
  Sparkles,
  Check,
} from 'lucide-react';

interface Suggestion {
  id: string;
  suggestion_type: string;
  target_url: string;
  target_element?: string;
  suggested_content: string;
  original_content?: string;
  status: 'pending' | 'approved' | 'applied' | 'rejected';
  confidence_score: number;
  character_count: number;
  metadata?: any;
}

interface SuggestionsReviewProps {
  suggestions: Suggestion[];
  onApprove: (suggestionIds: string[]) => Promise<void>;
  onReject: (suggestionIds: string[]) => Promise<void>;
  onApply: (suggestionIds: string[]) => Promise<void>;
  onEdit: (suggestionId: string, newContent: string) => Promise<void>;
  onRefresh?: () => void;
}

export function SuggestionsReview({
  suggestions,
  onApprove,
  onReject,
  onApply,
  onEdit,
  onRefresh,
}: SuggestionsReviewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const pendingIds = suggestions
      .filter((s) => s.status === 'pending')
      .map((s) => s.id);
    setSelectedIds(new Set(pendingIds));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleApproveSelected = async () => {
    setLoading(true);
    try {
      await onApprove(Array.from(selectedIds));
      clearSelection();
      onRefresh?.();
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSelected = async () => {
    setLoading(true);
    try {
      await onReject(Array.from(selectedIds));
      clearSelection();
      onRefresh?.();
    } finally {
      setLoading(false);
    }
  };

  const handleApplySelected = async () => {
    setLoading(true);
    try {
      await onApply(Array.from(selectedIds));
      clearSelection();
      onRefresh?.();
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (suggestion: Suggestion) => {
    setEditingId(suggestion.id);
    setEditedContent(suggestion.suggested_content);
  };

  const handleSaveEdit = async (suggestionId: string) => {
    setLoading(true);
    try {
      await onEdit(suggestionId, editedContent);
      setEditingId(null);
      onRefresh?.();
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusBadge = (status: Suggestion['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Approved</Badge>;
      case 'applied':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Applied</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
    }
  };

  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending');
  const approvedSuggestions = suggestions.filter((s) => s.status === 'approved');
  const appliedSuggestions = suggestions.filter((s) => s.status === 'applied');

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Suggestions</CardTitle>
          <CardDescription>No suggestions generated yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-500 text-center py-8">
            Click "Generate All" to create AI-powered suggestions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI Suggestions ({suggestions.length})
            </CardTitle>
            <CardDescription>
              {pendingSuggestions.length} pending • {approvedSuggestions.length} approved • {appliedSuggestions.length} applied
            </CardDescription>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">{selectedIds.size} selected</span>
              <Button onClick={handleApproveSelected} size="sm" disabled={loading}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                onClick={handleRejectSelected}
                size="sm"
                variant="outline"
                disabled={loading}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button onClick={clearSelection} size="sm" variant="ghost">
                Clear
              </Button>
            </div>
          )}
        </div>

        {pendingSuggestions.length > 0 && selectedIds.size === 0 && (
          <div className="mt-3">
            <Button onClick={selectAll} size="sm" variant="outline">
              Select All Pending ({pendingSuggestions.length})
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`rounded-lg border p-4 transition-colors ${
                suggestion.status === 'applied'
                  ? 'border-green-200 bg-green-50'
                  : suggestion.status === 'rejected'
                    ? 'border-red-100 bg-red-50'
                    : selectedIds.has(suggestion.id)
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Selection Checkbox */}
                {suggestion.status === 'pending' && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(suggestion.id)}
                    onChange={() => toggleSelection(suggestion.id)}
                    className="mt-1"
                  />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <a
                          href={suggestion.target_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {suggestion.target_url.replace(/^https?:\/\/[^/]+/, '')}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {getStatusBadge(suggestion.status)}
                      </div>
                      {suggestion.target_element && (
                        <div className="text-xs text-neutral-500">{suggestion.target_element}</div>
                      )}
                    </div>

                    {/* Confidence Score */}
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      {Math.round((suggestion.confidence_score || 0) * 100)}% confidence
                    </Badge>
                  </div>

                  {/* Original Content (if exists) */}
                  {suggestion.original_content && (
                    <div className="mb-3 p-3 bg-neutral-100 rounded text-sm">
                      <div className="text-xs text-neutral-600 mb-1 font-medium">Original:</div>
                      <div className="text-neutral-700">{suggestion.original_content}</div>
                    </div>
                  )}

                  {/* Suggested Content */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-green-700 font-medium flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI Suggestion:
                      </div>
                      <div className="text-xs text-neutral-500">
                        {suggestion.character_count} characters
                      </div>
                    </div>

                    {editingId === suggestion.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleSaveEdit(suggestion.id)}
                            size="sm"
                            disabled={loading}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            onClick={() => setEditingId(null)}
                            size="sm"
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                        <div className="text-neutral-900">{suggestion.suggested_content}</div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {suggestion.status === 'pending' && editingId !== suggestion.id && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => onApprove([suggestion.id])}
                        size="sm"
                        disabled={loading}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => onReject([suggestion.id])}
                        size="sm"
                        variant="outline"
                        disabled={loading}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleStartEdit(suggestion)}
                        size="sm"
                        variant="outline"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleCopyToClipboard(suggestion.suggested_content)}
                        size="sm"
                        variant="ghost"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  )}

                  {suggestion.status === 'approved' && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => onApply([suggestion.id])}
                        size="sm"
                        disabled={loading}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Mark as Applied
                      </Button>
                      <Button
                        onClick={() => handleCopyToClipboard(suggestion.suggested_content)}
                        size="sm"
                        variant="outline"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  )}

                  {suggestion.status === 'applied' && (
                    <div className="text-sm text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Applied successfully
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bulk Actions for Approved */}
        {approvedSuggestions.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">
                  {approvedSuggestions.length} Approved Suggestions
                </h4>
                <p className="text-sm text-blue-700">
                  Ready to implement on your website
                </p>
              </div>
              <Button
                onClick={() => {
                  const approvedIds = approvedSuggestions.map((s) => s.id);
                  setSelectedIds(new Set(approvedIds));
                  handleApplySelected();
                }}
                disabled={loading}
              >
                Mark All as Applied
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
