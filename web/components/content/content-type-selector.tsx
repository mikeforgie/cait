'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Mail, Tag } from 'lucide-react';

export function ContentTypeSelector() {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>What would you like to create?</CardTitle>
        <CardDescription>
          Choose a content type to get started with AI-powered generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <button
            className="p-4 text-left rounded-lg border border-neutral-900 bg-neutral-50 transition-colors hover:bg-neutral-100"
            onClick={() => scrollToSection('blog-generator')}
          >
            <FileText className="h-8 w-8 mb-2" />
            <p className="font-medium">Blog Post</p>
            <p className="text-sm text-neutral-600 mt-1">
              SEO-optimized long-form content for your target keywords
            </p>
          </button>

          <button
            className="p-4 text-left rounded-lg border border-neutral-200 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            onClick={() => scrollToSection('email-generator')}
          >
            <Mail className="h-8 w-8 mb-2" />
            <p className="font-medium">Outreach Email</p>
            <p className="text-sm text-neutral-600 mt-1">
              Personalized emails for backlink building and partnerships
            </p>
          </button>

          <button
            className="p-4 text-left rounded-lg border border-neutral-200 transition-colors hover:border-neutral-300 hover:bg-neutral-50 opacity-50 cursor-not-allowed"
            disabled
          >
            <Tag className="h-8 w-8 mb-2" />
            <p className="font-medium">Meta Descriptions</p>
            <p className="text-sm text-neutral-600 mt-1">
              Click-worthy meta tags optimized for CTR (Coming Soon)
            </p>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
