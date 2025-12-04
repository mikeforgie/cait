/**
 * AI Guide Modal Component
 * Interactive wizard that walks users through setup guides with AI assistance
 */

'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIGuide, AIGuideStep } from '@/lib/ai/guides/guide-types';
import {
  CheckCircle,
  Circle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  Clock,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIGuideModalProps {
  guide: AIGuide;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

interface StepStatus {
  completed: boolean;
  aiHelpUsed: boolean;
}

export function AIGuideModal({ guide, isOpen, onClose, onComplete }: AIGuideModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(
    guide.steps.map(() => ({ completed: false, aiHelpUsed: false }))
  );
  const [isLoadingAIHelp, setIsLoadingAIHelp] = useState(false);
  const [aiHelpResponse, setAiHelpResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetailedHelp, setShowDetailedHelp] = useState(false);

  const step = guide.steps[currentStep];
  const progress = ((currentStep + 1) / guide.steps.length) * 100;
  const isLastStep = currentStep === guide.steps.length - 1;
  const isFirstStep = currentStep === 0;
  const allStepsCompleted = stepStatuses.every((s) => s.completed);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setStepStatuses(guide.steps.map(() => ({ completed: false, aiHelpUsed: false })));
      setAiHelpResponse(null);
      setError(null);
      setShowDetailedHelp(false);
    }
  }, [isOpen, guide.steps]);

  const handleAskAI = useCallback(async () => {
    setIsLoadingAIHelp(true);
    setError(null);
    setAiHelpResponse(null);

    try {
      const response = await fetch('/api/ai/guide-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guideId: guide.id,
          stepIndex: currentStep,
          helpPrompt: step.helpPrompt,
          stepTitle: step.title,
          stepInstruction: step.instruction,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI help');
      }

      const data = await response.json();
      setAiHelpResponse(data.help);

      // Mark that AI help was used for this step
      setStepStatuses((prev) => {
        const updated = [...prev];
        updated[currentStep] = { ...updated[currentStep], aiHelpUsed: true };
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI help');
    } finally {
      setIsLoadingAIHelp(false);
    }
  }, [guide.id, currentStep, step]);

  const handleMarkComplete = useCallback(() => {
    setStepStatuses((prev) => {
      const updated = [...prev];
      updated[currentStep] = { ...updated[currentStep], completed: true };
      return updated;
    });

    // Clear AI help when moving on
    setAiHelpResponse(null);
    setShowDetailedHelp(false);

    if (isLastStep) {
      // All done!
      onComplete?.();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, isLastStep, onComplete]);

  const handlePrevious = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
      setAiHelpResponse(null);
      setShowDetailedHelp(false);
    }
  }, [isFirstStep]);

  const handleSkipStep = useCallback(() => {
    setAiHelpResponse(null);
    setShowDetailedHelp(false);
    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep]);

  const getDifficultyColor = (difficulty: AIGuide['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'hard':
        return 'text-red-600 bg-red-50';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">{guide.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {guide.estimatedTime}
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                      getDifficultyColor(guide.difficulty)
                    )}
                  >
                    {guide.difficulty}
                  </span>
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>
                Step {currentStep + 1} of {guide.steps.length}
              </span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-2">
            {guide.steps.map((s, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentStep(index);
                  setAiHelpResponse(null);
                  setShowDetailedHelp(false);
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                  index === currentStep
                    ? 'bg-blue-100 text-blue-700'
                    : stepStatuses[index].completed
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {stepStatuses[index].completed ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{s.title}</span>
                <span className="sm:hidden">{index + 1}</span>
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Current Step */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">{step.title}</h3>
            <p className="text-gray-700">{step.instruction}</p>

            {/* Detailed Help Toggle */}
            {step.detailedHelp && (
              <div className="mt-3">
                <button
                  onClick={() => setShowDetailedHelp(!showDetailedHelp)}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                >
                  <HelpCircle className="w-4 h-4" />
                  {showDetailedHelp ? 'Hide details' : 'Show more details'}
                </button>
                {showDetailedHelp && (
                  <div className="mt-2 p-3 bg-white rounded-md border border-gray-200 text-sm text-gray-700">
                    {step.detailedHelp}
                  </div>
                )}
              </div>
            )}

            {/* Validation URL hint */}
            {step.validationUrl && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <ExternalLink className="w-4 h-4" />
                <span>This step will be validated automatically</span>
              </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* AI Help Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-900">AI Assistant</span>
              </div>
              <Button
                onClick={handleAskAI}
                disabled={isLoadingAIHelp}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                {isLoadingAIHelp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Getting help...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Ask AI for Help
                  </>
                )}
              </Button>
            </div>

            {aiHelpResponse ? (
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap">
                {aiHelpResponse}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Stuck on this step? Click &quot;Ask AI for Help&quot; for personalized guidance.
              </p>
            )}
          </div>

          {/* Prerequisites (shown on first step) */}
          {isFirstStep && guide.prerequisites && guide.prerequisites.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Before you start:</h4>
              <ul className="space-y-1">
                {guide.prerequisites.map((prereq, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-yellow-700">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {prereq}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Steps (shown on completion) */}
          {allStepsCompleted && guide.nextSteps && guide.nextSteps.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                All steps completed!
              </h4>
              <p className="text-sm text-green-700 mb-2">What&apos;s next:</p>
              <ul className="space-y-1">
                {guide.nextSteps.map((next, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-green-700">
                    <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {next}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 border-t pt-4 gap-2 sm:gap-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handlePrevious} disabled={isFirstStep} size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <Button
              variant="ghost"
              onClick={handleSkipStep}
              disabled={isLastStep}
              size="sm"
              className="text-gray-500"
            >
              Skip
            </Button>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <Button variant="outline" onClick={onClose} size="sm">
              Close
            </Button>
            <Button
              onClick={handleMarkComplete}
              size="sm"
              className={cn(
                'gap-2',
                stepStatuses[currentStep].completed
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              {stepStatuses[currentStep].completed ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Completed
                </>
              ) : isLastStep ? (
                'Finish Guide'
              ) : (
                <>
                  Mark Complete
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
