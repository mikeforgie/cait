'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { ChevronDown, ChevronRight, GripVertical, Plus, Trash2, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskDetailModal, TaskDetail } from './TaskDetailModal';
import { AutomationResultModal, AutomationResult } from './AutomationResultModal';

interface Task extends TaskDetail {
  dueDate?: string;
}

interface StatusColumn {
  id: string;
  title: string;
  tasks: Task[];
}

interface TaskCategory {
  id: string;
  name: string;
  color: 'red' | 'orange' | 'green';
  icon: string;
  columns: StatusColumn[];
}

export const ExpandableTasksBoard = () => {
  const params = useParams();
  const clientId = params?.id as string;

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['onsite']));
  const [draggedTask, setDraggedTask] = useState<{
    categoryId: string;
    columnId: string;
    taskId: string;
  } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [automationResult, setAutomationResult] = useState<AutomationResult | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const [categories, setCategories] = useState<TaskCategory[]>([
    {
      id: 'onsite',
      name: 'On-Site SEO',
      color: 'red',
      icon: '🎯',
      columns: [
        {
          id: 'todo',
          title: 'To Do',
          tasks: [
            {
              id: 'os-1',
              title: 'Implement SSL/HTTPS certificate',
              description: 'Security & Setup - Critical for trust and rankings',
              priority: 'high',
              status: 'todo',
              whyItMatters: 'SSL certificates encrypt data between your website and visitors. Google has confirmed HTTPS is a ranking factor, and browsers show "Not Secure" warnings for non-HTTPS sites, which damages trust and conversions.',
              instructions: [
                'Check if your hosting provider offers free SSL (most do via Let\'s Encrypt)',
                'Enable SSL in your hosting control panel or request it from support',
                'Update your WordPress/CMS settings to use HTTPS URLs',
                'Set up 301 redirects from HTTP to HTTPS',
                'Update internal links and resources to use HTTPS',
                'Submit the HTTPS version to Google Search Console'
              ],
              estimatedTime: '30 minutes - 2 hours',
              automatable: false,
              resources: [
                { label: 'Google\'s HTTPS Guide', url: 'https://developers.google.com/search/docs/crawling-indexing/https' },
                { label: 'Let\'s Encrypt - Free SSL', url: 'https://letsencrypt.org/' }
              ]
            },
            {
              id: 'os-2',
              title: 'Optimize robots.txt file',
              description: 'Sitemaps & Indexation - Control crawler access',
              priority: 'high',
              status: 'todo',
              whyItMatters: 'The robots.txt file tells search engines which pages to crawl and which to ignore. A missing or misconfigured robots.txt can lead to wasted crawl budget or accidentally blocking important pages.',
              instructions: [
                'Check if robots.txt exists at yourdomain.com/robots.txt',
                'Ensure important pages are not blocked (Disallow)',
                'Add your sitemap URL to robots.txt',
                'Block admin, login, and duplicate content pages',
                'Test in Google Search Console\'s robots.txt tester'
              ],
              estimatedTime: '15-30 minutes',
              automatable: true,
              automationDescription: 'AI can analyze your site, create an optimized robots.txt file, and submit it to Google Search Console.',
              resources: [
                { label: 'Google robots.txt Guide', url: 'https://developers.google.com/search/docs/crawling-indexing/robots/intro' }
              ]
            },
            {
              id: 'os-3',
              title: 'Check page speed with PageSpeed Insights',
              description: 'Page Speed & Performance - Identify bottlenecks',
              priority: 'high',
              status: 'todo',
            },
            {
              id: 'os-4',
              title: 'Optimize images (compress, format, size)',
              description: 'Page Speed & Performance - Reduce load times',
              priority: 'medium',
              status: 'todo',
            },
            {
              id: 'os-5',
              title: 'Implement lazy loading for images',
              description: 'Page Speed & Performance - Improve initial load',
              priority: 'medium',
              status: 'todo',
            },
            {
              id: 'os-6',
              title: 'Set up 404 error page',
              description: 'Site Health - Improve user experience',
              priority: 'medium',
              status: 'todo',
            },
            {
              id: 'os-7',
              title: 'Use canonical tags for duplicate content',
              description: 'Site Health - Prevent duplicate content issues',
              priority: 'high',
              status: 'todo',
            },
            {
              id: 'os-8',
              title: 'Optimize title tags (50-60 chars)',
              description: 'Title Tags & Meta - Include target keywords',
              priority: 'high',
              status: 'todo',
            },
            {
              id: 'os-9',
              title: 'Write meta descriptions (150-160 chars)',
              description: 'Title Tags & Meta - Improve CTR from search',
              priority: 'high',
              status: 'todo',
            },
            {
              id: 'os-10',
              title: 'Use only ONE H1 per page',
              description: 'Headers & Content Structure - SEO best practice',
              priority: 'medium',
              status: 'todo',
            },
            {
              id: 'os-11',
              title: 'Add descriptive alt text to all images',
              description: 'Images & Alt Text - Accessibility and SEO',
              priority: 'medium',
              status: 'todo',
            },
            {
              id: 'os-12',
              title: 'Implement JSON-LD schema markup',
              description: 'Schema Markup - Enable rich results',
              priority: 'high',
              status: 'todo',
            },
            {
              id: 'os-13',
              title: 'Add FAQ schema for FAQs',
              description: 'Schema Markup - Featured snippet opportunity',
              priority: 'medium',
              status: 'todo',
            },
            {
              id: 'os-14',
              title: 'Create breadcrumb navigation',
              description: 'Site Structure - Improve UX and SEO',
              priority: 'low',
              status: 'todo',
            },
            {
              id: 'os-15',
              title: 'Make website mobile-friendly',
              description: 'Mobile & Responsiveness - Critical ranking factor',
              priority: 'high',
              status: 'todo',
            },
          ],
        },
        {
          id: 'in_progress',
          title: 'In Progress',
          tasks: [
            {
              id: 'os-16',
              title: 'Set up Google Search Console',
              description: 'Security & Setup - Monitor search performance',
              priority: 'high',
              status: 'in_progress',
            },
            {
              id: 'os-17',
              title: 'Create XML sitemap',
              description: 'Sitemaps & Indexation - Help search engines crawl',
              priority: 'high',
              status: 'in_progress',
              whyItMatters: 'An XML sitemap helps search engines discover and index all your important pages. Without one, search engines may miss pages, especially newer or deeply nested content.',
              instructions: [
                'Generate a sitemap using your CMS (WordPress has plugins like Yoast/RankMath)',
                'Ensure the sitemap only includes indexable, canonical pages',
                'Verify sitemap is accessible at yourdomain.com/sitemap.xml',
                'Submit the sitemap to Google Search Console',
                'Submit the sitemap to Bing Webmaster Tools'
              ],
              estimatedTime: '15-30 minutes',
              automatable: true,
              automationDescription: 'AI can generate your sitemap, verify it\'s valid, and submit it to Google Search Console and Bing Webmaster Tools automatically.',
              resources: [
                { label: 'Google Sitemap Guide', url: 'https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview' }
              ]
            },
            {
              id: 'os-18',
              title: 'Enable GZIP compression',
              description: 'Page Speed & Performance - Reduce file sizes',
              priority: 'medium',
              status: 'in_progress',
            },
            {
              id: 'os-19',
              title: 'Create pillar page linking strategy',
              description: 'Internal Linking - Build topical authority',
              priority: 'medium',
              status: 'in_progress',
            },
          ],
        },
        {
          id: 'done',
          title: 'Done',
          tasks: [
            {
              id: 'os-20',
              title: 'Set up Google Analytics',
              description: 'Security & Setup - Track website performance',
              priority: 'high',
              status: 'done',
            },
            {
              id: 'os-21',
              title: 'Create clean URL structure',
              description: 'Site Structure - SEO-friendly URLs',
              priority: 'high',
              status: 'done',
            },
            {
              id: 'os-22',
              title: 'Add Open Graph meta tags',
              description: 'Open Graph & Social - Better social sharing',
              priority: 'low',
              status: 'done',
            },
          ],
        },
      ],
    },
    {
      id: 'offsite',
      name: 'Off-Site SEO',
      color: 'orange',
      icon: '🔗',
      columns: [
        {
          id: 'todo',
          title: 'To Do',
          tasks: [
            {
              id: 'off-1',
              title: 'Build 10 high-quality backlinks',
              description: 'Link Building - Target DR 50+ websites',
              priority: 'high',
              status: 'todo',
            },
            {
              id: 'off-2',
              title: 'Submit to industry directories',
              description: 'Directory Submissions - Improve local presence',
              priority: 'medium',
              status: 'todo',
            },
            {
              id: 'off-3',
              title: 'Create social media profiles',
              description: 'Social Signals - LinkedIn, Twitter, Facebook',
              priority: 'medium',
              status: 'todo',
            },
            {
              id: 'off-4',
              title: 'Reach out to 20 websites for guest posts',
              description: 'Outreach - Secure guest posting opportunities',
              priority: 'high',
              status: 'todo',
            },
            {
              id: 'off-5',
              title: 'Monitor brand mentions',
              description: 'Brand Building - Track unlinked mentions',
              priority: 'low',
              status: 'todo',
            },
            {
              id: 'off-6',
              title: 'Build relationships with industry influencers',
              description: 'Outreach - Long-term link building strategy',
              priority: 'medium',
              status: 'todo',
            },
            {
              id: 'off-7',
              title: 'Create shareable infographics',
              description: 'Link Bait - Design 3 data-driven infographics',
              priority: 'medium',
              status: 'todo',
            },
            {
              id: 'off-8',
              title: 'Reclaim broken backlinks',
              description: 'Link Recovery - Fix 404 backlinks',
              priority: 'high',
              status: 'todo',
            },
          ],
        },
        {
          id: 'in_progress',
          title: 'In Progress',
          tasks: [
            {
              id: 'off-9',
              title: 'Write 3 guest posts for industry blogs',
              description: 'Guest Posting - Target high-authority sites',
              priority: 'high',
              status: 'in_progress',
            },
            {
              id: 'off-10',
              title: 'Conduct competitor backlink analysis',
              description: 'Competitive Analysis - Find link opportunities',
              priority: 'medium',
              status: 'in_progress',
            },
            {
              id: 'off-11',
              title: 'Build citations on local directories',
              description: 'Local SEO - NAP consistency across platforms',
              priority: 'medium',
              status: 'in_progress',
            },
          ],
        },
        {
          id: 'done',
          title: 'Done',
          tasks: [
            {
              id: 'off-12',
              title: 'Set up Google Business Profile',
              description: 'Local SEO - Optimize for local search',
              priority: 'high',
              status: 'done',
            },
            {
              id: 'off-13',
              title: 'Disavow toxic backlinks',
              description: 'Link Cleanup - Remove spammy links',
              priority: 'high',
              status: 'done',
            },
          ],
        },
      ],
    },
    {
      id: 'content',
      name: 'Content Strategy',
      color: 'green',
      icon: '✍️',
      columns: [
        {
          id: 'todo',
          title: 'To Do',
          tasks: [
            {
              id: 'con-1',
              title: 'Do keyword research',
              description: 'Keyword Strategy - Identify target keywords',
              priority: 'high',
              status: 'todo',
            },
            {
              id: 'con-2',
              title: 'Create comprehensive topic clusters',
              description: 'Content Structure - Build topical authority',
              priority: 'high',
              status: 'todo',
            },
            {
              id: 'con-3',
              title: 'Write 5 pillar pages',
              description: 'Content Depth - Cover main topics completely',
              priority: 'high',
              status: 'todo',
            },
            {
              id: 'con-4',
              title: 'Optimize for featured snippets',
              description: 'Featured Snippets - Target position zero',
              priority: 'medium',
              status: 'todo',
            },
            {
              id: 'con-5',
              title: 'Add FAQ sections to key pages',
              description: 'FAQ Optimization - Answer common questions',
              priority: 'medium',
              status: 'todo',
            },
            {
              id: 'con-6',
              title: 'Create About page',
              description: 'Brand & Company - Build trust and authority',
              priority: 'medium',
              status: 'todo',
            },
            {
              id: 'con-7',
              title: 'Create Contact page',
              description: 'Brand & Company - Include all contact info',
              priority: 'medium',
              status: 'todo',
            },
            {
              id: 'con-8',
              title: 'Update 10 declining pages',
              description: 'Content Updates - Refresh with new info',
              priority: 'high',
              status: 'todo',
            },
            {
              id: 'con-9',
              title: 'Add author bios to all articles',
              description: 'E-A-T Signals - Show expertise',
              priority: 'medium',
              status: 'todo',
            },
            {
              id: 'con-10',
              title: 'Include original research in content',
              description: 'E-A-T Signals - Demonstrate authority',
              priority: 'low',
              status: 'todo',
            },
            {
              id: 'con-11',
              title: 'Create Table of Contents for long posts',
              description: 'Content Structure - Improve scannability',
              priority: 'low',
              status: 'todo',
            },
            {
              id: 'con-12',
              title: 'Match competitor word count',
              description: 'Content Depth - Analyze top-ranking pages',
              priority: 'medium',
              status: 'todo',
            },
          ],
        },
        {
          id: 'in_progress',
          title: 'In Progress',
          tasks: [
            {
              id: 'con-13',
              title: 'Identify competitor content gaps',
              description: 'Competitive Analysis - Find opportunities',
              priority: 'high',
              status: 'in_progress',
            },
            {
              id: 'con-14',
              title: 'Write blog post on SEO best practices',
              description: 'Content Creation - 2000+ words, comprehensive',
              priority: 'high',
              status: 'in_progress',
            },
            {
              id: 'con-15',
              title: 'Create video content strategy',
              description: 'Multimedia Content - Plan 10 video topics',
              priority: 'medium',
              status: 'in_progress',
            },
            {
              id: 'con-16',
              title: 'Add strategic CTAs to all pages',
              description: 'Engagement Elements - Improve conversions',
              priority: 'medium',
              status: 'in_progress',
            },
          ],
        },
        {
          id: 'done',
          title: 'Done',
          tasks: [
            {
              id: 'con-17',
              title: 'Match search intent for top pages',
              description: 'Content Quality - Informational vs transactional',
              priority: 'high',
              status: 'done',
            },
            {
              id: 'con-18',
              title: 'Create Privacy Policy page',
              description: 'Brand & Company - Legal requirement',
              priority: 'high',
              status: 'done',
            },
            {
              id: 'con-19',
              title: 'Create Terms of Service page',
              description: 'Brand & Company - Legal requirement',
              priority: 'high',
              status: 'done',
            },
          ],
        },
      ],
    },
  ]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDragStart = (categoryId: string, columnId: string, taskId: string) => {
    setDraggedTask({ categoryId, columnId, taskId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetCategoryId: string, targetColumnId: string) => {
    if (!draggedTask) return;

    // Can only move within the same category
    if (draggedTask.categoryId !== targetCategoryId) return;

    setCategories(
      categories.map((cat) => {
        if (cat.id !== targetCategoryId) return cat;

        return {
          ...cat,
          columns: cat.columns.map((col) => {
            // Remove from source column
            if (col.id === draggedTask.columnId) {
              return {
                ...col,
                tasks: col.tasks.filter((task) => task.id !== draggedTask.taskId),
              };
            }

            // Add to target column
            if (col.id === targetColumnId) {
              const draggedTaskObj = cat.columns
                .find((c) => c.id === draggedTask.columnId)
                ?.tasks.find((t) => t.id === draggedTask.taskId);

              if (draggedTaskObj) {
                return {
                  ...col,
                  tasks: [...col.tasks, { ...draggedTaskObj, status: targetColumnId as any }],
                };
              }
            }

            return col;
          }),
        };
      })
    );

    setDraggedTask(null);
  };

  const deleteTask = (categoryId: string, columnId: string, taskId: string) => {
    setCategories(
      categories.map((cat) => {
        if (cat.id !== categoryId) return cat;

        return {
          ...cat,
          columns: cat.columns.map((col) => {
            if (col.id !== columnId) return col;
            return {
              ...col,
              tasks: col.tasks.filter((task) => task.id !== taskId),
            };
          }),
        };
      })
    );
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleMarkComplete = (taskId: string) => {
    setCategories(
      categories.map((cat) => ({
        ...cat,
        columns: cat.columns.map((col) => {
          const taskIndex = col.tasks.findIndex((t) => t.id === taskId);
          if (taskIndex === -1) return col;

          const task = col.tasks[taskIndex];
          // Remove from current column
          const updatedTasks = col.tasks.filter((t) => t.id !== taskId);

          // If this is the done column, keep it here
          if (col.id === 'done') {
            return { ...col, tasks: updatedTasks };
          }

          return { ...col, tasks: updatedTasks };
        }),
      })).map((cat) => ({
        ...cat,
        columns: cat.columns.map((col) => {
          if (col.id !== 'done') return col;

          // Find the task from any column and add to done
          const allTasks = categories.flatMap((c) => c.columns.flatMap((column) => column.tasks));
          const task = allTasks.find((t) => t.id === taskId);
          if (!task) return col;

          // Check if already in done
          if (col.tasks.some((t) => t.id === taskId)) return col;

          return {
            ...col,
            tasks: [...col.tasks, { ...task, status: 'done' as const }],
          };
        }),
      }))
    );
    handleCloseModal();
  };

  const handleRunAutomation = async (taskId: string) => {
    if (!clientId) {
      alert('Client ID not found. Please navigate to a client first.');
      return;
    }

    try {
      const response = await fetch('/api/automation/run-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          taskId,
          taskType: taskId,
        }),
      });

      const result = await response.json();

      // Close the task modal and show results
      handleCloseModal();
      setAutomationResult(result);
      setIsResultModalOpen(true);

    } catch (error) {
      console.error('Automation error:', error);
      setAutomationResult({
        success: false,
        taskId,
        action: 'error',
        message: 'Failed to run automation',
        error: error instanceof Error ? error.message : 'Network error',
      });
      setIsResultModalOpen(true);
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-l-red-500';
      case 'medium':
        return 'border-l-4 border-l-yellow-500';
      case 'low':
        return 'border-l-4 border-l-green-500';
    }
  };

  const getCategoryColor = (color: 'red' | 'orange' | 'green') => {
    switch (color) {
      case 'red':
        return {
          dot: 'bg-red-500 shadow-lg shadow-red-500/40',
          header: 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border-l-4 border-red-500',
          text: 'text-red-600',
          count: 'text-red-500 font-bold',
        };
      case 'orange':
        return {
          dot: 'bg-yellow-500 shadow-lg shadow-yellow-500/30',
          header: 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-l-4 border-yellow-500',
          text: 'text-yellow-600',
          count: 'text-yellow-500 font-bold',
        };
      case 'green':
        return {
          dot: 'bg-green-500 shadow-lg shadow-green-500/40',
          header: 'bg-gradient-to-r from-green-500/10 to-cyan-500/10 border-l-4 border-green-500',
          text: 'text-green-600',
          count: 'text-green-500 font-bold',
        };
    }
  };

  const getColumnColor = (columnId: string) => {
    switch (columnId) {
      case 'todo':
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          text: 'text-gray-700',
        };
      case 'in_progress':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-300',
          text: 'text-blue-700',
        };
      case 'done':
        return {
          bg: 'bg-green-50',
          border: 'border-green-300',
          text: 'text-green-700',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          text: 'text-gray-700',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold gradient-text">Tasks</h2>
        <p className="text-gray-600 mt-1">Manage your SEO tasks by category and status</p>
      </div>

      {/* Expandable Categories */}
      <div className="space-y-4">
        {categories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const colorConfig = getCategoryColor(category.color);
          const totalTasks = category.columns.reduce((sum, col) => sum + col.tasks.length, 0);

          return (
            <Card key={category.id} className="shadow-sm overflow-hidden">
              {/* Category Header - Clickable */}
              <CardHeader
                className={`cursor-pointer hover:bg-gray-50 transition-colors ${colorConfig.header}`}
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    )}
                    <span className="text-2xl">{category.icon}</span>
                    <CardTitle className="text-lg font-bold">{category.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${colorConfig.count} bg-white`}>
                      {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                </div>
              </CardHeader>

              {/* Kanban Board - Expandable */}
              {isExpanded && (
                <CardContent className="p-6 bg-gradient-to-br from-gray-50 to-white">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {category.columns.map((column) => {
                      const columnColorConfig = getColumnColor(column.id);
                      return (
                        <div
                          key={column.id}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(category.id, column.id)}
                          className={`rounded-lg overflow-hidden border-2 ${columnColorConfig.border} ${columnColorConfig.bg}`}
                        >
                          {/* Column Header */}
                          <div className="p-3 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <h4 className={`font-bold text-sm ${columnColorConfig.text}`}>{column.title}</h4>
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${columnColorConfig.text} bg-white`}>
                                {column.tasks.length}
                              </span>
                            </div>
                          </div>

                          {/* Tasks Container */}
                          <div className="p-3 space-y-2 min-h-48 max-h-96 overflow-y-auto">
                            {column.tasks.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                                <div className="text-3xl mb-1">📭</div>
                                <p className="text-xs">No tasks</p>
                              </div>
                            ) : (
                              column.tasks.map((task) => (
                                <div
                                  key={task.id}
                                  draggable
                                  onDragStart={() => handleDragStart(category.id, column.id, task.id)}
                                  onClick={() => handleTaskClick(task)}
                                  className={`p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer ${getPriorityColor(
                                    task.priority
                                  )}`}
                                >
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <GripVertical className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5 cursor-grab" />
                                    <div className="flex items-center gap-1">
                                      {task.automatable && (
                                        <span className="p-1 bg-purple-50 rounded" title="AI can automate this">
                                          <Bot className="w-3 h-3 text-purple-500" />
                                        </span>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteTask(category.id, column.id, task.id);
                                        }}
                                        className="p-1 hover:bg-red-50 rounded transition-colors"
                                        title="Delete task"
                                      >
                                        <Trash2 className="w-3 h-3 text-red-500 hover:text-red-700" />
                                      </button>
                                    </div>
                                  </div>

                                  <h5 className="font-semibold text-gray-900 text-sm mb-1">{task.title}</h5>
                                  <p className="text-xs text-gray-600 mb-2">{task.description}</p>

                                  {/* Priority Badge */}
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                                        task.priority === 'high'
                                          ? 'bg-red-100 text-red-700'
                                          : task.priority === 'medium'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-green-100 text-green-700'
                                      }`}
                                    >
                                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                    </span>
                                    <span className="text-xs text-blue-600 hover:underline">Click for details →</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Add Task Button */}
                          <div className="p-3 border-t border-gray-200">
                            <button className="w-full flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-900 transition-colors font-semibold text-xs">
                              <Plus className="w-3 h-3" />
                              Add Task
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onMarkComplete={handleMarkComplete}
        onRunAutomation={handleRunAutomation}
      />

      {/* Automation Result Modal */}
      <AutomationResultModal
        result={automationResult}
        isOpen={isResultModalOpen}
        onClose={() => {
          setIsResultModalOpen(false);
          setAutomationResult(null);
        }}
      />
    </div>
  );
};
