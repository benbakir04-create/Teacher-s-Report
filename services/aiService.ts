/**
 * AI Service
 * 
 * Provides intelligent analysis, recommendations, and summaries.
 * Phase 9: AI Layer
 */

// --- Configuration ---
const AI_API_URL = import.meta.env.VITE_AI_API_URL || '';
const USE_MOCK = !AI_API_URL;

// --- Types ---

export type Sentiment = 'positive' | 'negative' | 'neutral';
export type TopicCategory = 'behavior' | 'academic' | 'attendance' | 'quran' | 'other';
export type EntityType = 'student' | 'subject' | 'issue' | 'achievement';
export type RecommendationType = 'teaching' | 'management' | 'student' | 'curriculum';
export type Priority = 'high' | 'medium' | 'low';

export interface Topic {
    name: string;
    category: TopicCategory;
    frequency: number;
}

export interface Entity {
    text: string;
    type: EntityType;
    sentiment?: Sentiment;
}

export interface AIAnalysis {
    sentiment: Sentiment;
    sentimentScore: number; // -1 to 1
    topics: Topic[];
    entities: Entity[];
    suggestions: string[];
    concerns: string[];
    confidence: number;
}

export interface Recommendation {
    id: string;
    type: RecommendationType;
    title: string;
    description: string;
    priority: Priority;
    actionable: boolean;
    icon?: string;
}

export interface WeeklySummary {
    teacherId: string;
    weekStart: string;
    totalReports: number;
    completionRate: number;
    averageQuality: number;
    topTopics: Topic[];
    strengths: string[];
    improvements: string[];
    recommendations: Recommendation[];
    studentAlerts: { name: string; reason: string; count: number }[];
}

export interface AdminInsight {
    id: string;
    type: 'prediction' | 'alert' | 'trend' | 'opportunity';
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    entityType: 'school' | 'teacher' | 'student';
    entityId: string;
    entityName: string;
    metric?: { current: number; predicted: number; change: number };
    createdAt: number;
}

// --- Arabic NLP Utilities ---

const ARABIC_POSITIVE_WORDS = [
    'ممتاز', 'رائع', 'مبدع', 'متفوق', 'نشيط', 'مجتهد', 'ملتزم', 'منضبط',
    'تحسن', 'تقدم', 'إنجاز', 'نجاح', 'تميز', 'حماس', 'تعاون', 'مشاركة',
    'إيجابي', 'فعال', 'مثالي', 'جيد', 'حسن', 'سريع', 'متابع'
];

const ARABIC_NEGATIVE_WORDS = [
    'ضعيف', 'متأخر', 'غياب', 'مشاغب', 'مهمل', 'كسول', 'بطيء', 'متشتت',
    'مشكلة', 'صعوبة', 'تراجع', 'انخفاض', 'سلبي', 'عدم', 'لم', 'لا',
    'ضعف', 'إهمال', 'تقصير', 'قلق', 'خوف', 'عدوان', 'شجار'
];

const TOPIC_KEYWORDS: Record<TopicCategory, string[]> = {
    behavior: ['سلوك', 'انضباط', 'مشاغب', 'هادئ', 'تعاون', 'عدوان', 'شجار', 'احترام'],
    academic: ['تحصيل', 'درجات', 'اختبار', 'واجب', 'فهم', 'استيعاب', 'حفظ', 'مراجعة'],
    attendance: ['غياب', 'تأخر', 'حضور', 'انصراف', 'استئذان', 'مرض'],
    quran: ['قرآن', 'حفظ', 'تلاوة', 'تجويد', 'سورة', 'آية', 'مراجعة'],
    other: []
};

function analyzeSentiment(text: string): { sentiment: Sentiment; score: number } {
    const words = text.split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of words) {
        if (ARABIC_POSITIVE_WORDS.some(pw => word.includes(pw))) positiveCount++;
        if (ARABIC_NEGATIVE_WORDS.some(nw => word.includes(nw))) negativeCount++;
    }

    const score = (positiveCount - negativeCount) / Math.max(words.length * 0.1, 1);
    const clampedScore = Math.max(-1, Math.min(1, score));

    return {
        sentiment: clampedScore > 0.2 ? 'positive' : clampedScore < -0.2 ? 'negative' : 'neutral',
        score: clampedScore
    };
}

function extractTopics(text: string): Topic[] {
    const topics: Topic[] = [];
    
    for (const [category, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        if (category === 'other') continue;
        
        let frequency = 0;
        for (const keyword of keywords) {
            const matches = text.match(new RegExp(keyword, 'gi'));
            if (matches) frequency += matches.length;
        }
        
        if (frequency > 0) {
            topics.push({
                name: getCategoryLabel(category as TopicCategory),
                category: category as TopicCategory,
                frequency
            });
        }
    }

    return topics.sort((a, b) => b.frequency - a.frequency);
}

function getCategoryLabel(category: TopicCategory): string {
    const labels: Record<TopicCategory, string> = {
        behavior: 'السلوك',
        academic: 'التحصيل الدراسي',
        attendance: 'الحضور والغياب',
        quran: 'القرآن الكريم',
        other: 'أخرى'
    };
    return labels[category];
}

function extractEntities(text: string): Entity[] {
    const entities: Entity[] = [];
    
    // Simple pattern matching for common Arabic name patterns
    const studentPattern = /(?:الطالب|التلميذ|الطالبة)\s+(\S+(?:\s+\S+)?)/g;
    let match;
    
    while ((match = studentPattern.exec(text)) !== null) {
        entities.push({
            text: match[1],
            type: 'student',
            sentiment: analyzeSentiment(text.slice(match.index, match.index + 50)).sentiment
        });
    }

    // Extract issues
    const issuePatterns = ['مشكلة', 'صعوبة', 'ضعف في', 'يحتاج'];
    for (const pattern of issuePatterns) {
        if (text.includes(pattern)) {
            const idx = text.indexOf(pattern);
            const snippet = text.slice(idx, Math.min(idx + 30, text.length));
            entities.push({
                text: snippet,
                type: 'issue'
            });
        }
    }

    return entities;
}

function generateSuggestions(analysis: Partial<AIAnalysis>): string[] {
    const suggestions: string[] = [];

    // Based on topics
    if (analysis.topics?.some(t => t.category === 'behavior')) {
        suggestions.push('جرّب استخدام نظام النقاط التحفيزية لتحسين السلوك الصفي');
    }
    
    if (analysis.topics?.some(t => t.category === 'academic')) {
        suggestions.push('فكّر في تطبيق التعلم التعاوني لرفع مستوى التحصيل');
    }

    if (analysis.sentiment === 'negative') {
        suggestions.push('حاول التركيز على الإيجابيات مع تحديد نقاط التحسين بوضوح');
    }

    if (analysis.entities?.filter(e => e.type === 'student').length === 1) {
        suggestions.push('راقب هذا الطالب عن كثب وتواصل مع ولي الأمر إن لزم');
    }

    return suggestions;
}

// --- Mock Data Generators ---

function mockAnalyzeNote(text: string): AIAnalysis {
    const { sentiment, score } = analyzeSentiment(text);
    const topics = extractTopics(text);
    const entities = extractEntities(text);
    
    const analysis: Partial<AIAnalysis> = { sentiment, topics, entities };
    const suggestions = generateSuggestions(analysis);
    
    const concerns: string[] = [];
    if (entities.filter(e => e.type === 'student' && e.sentiment === 'negative').length > 0) {
        concerns.push('يوجد طلاب يحتاجون متابعة خاصة');
    }
    if (topics.some(t => t.category === 'behavior' && t.frequency > 2)) {
        concerns.push('تكرار ملاحظات السلوك يستدعي تدخلاً');
    }

    return {
        sentiment,
        sentimentScore: score,
        topics,
        entities,
        suggestions,
        concerns,
        confidence: 0.85
    };
}

function mockWeeklySummary(teacherId: string): WeeklySummary {
    return {
        teacherId,
        weekStart: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
        totalReports: 5,
        completionRate: 100,
        averageQuality: 87,
        topTopics: [
            { name: 'السلوك', category: 'behavior', frequency: 8 },
            { name: 'التحصيل الدراسي', category: 'academic', frequency: 5 },
            { name: 'القرآن الكريم', category: 'quran', frequency: 4 }
        ],
        strengths: [
            'التزام ممتاز بتسجيل التقارير اليومية',
            'تنويع في استراتيجيات التدريس',
            'متابعة جيدة لتقدم الطلاب في القرآن'
        ],
        improvements: [
            'زيادة التركيز على الطلاب ذوي الصعوبات',
            'تفعيل أكبر للوسائل التعليمية الرقمية'
        ],
        recommendations: [
            {
                id: '1',
                type: 'teaching',
                title: 'تطبيق التعلم المتمايز',
                description: 'جرّب تقسيم الطلاب لمجموعات حسب المستوى وتقديم أنشطة مختلفة',
                priority: 'medium',
                actionable: true
            },
            {
                id: '2',
                type: 'student',
                title: 'خطة فردية للطالب أحمد',
                description: 'بناءً على الملاحظات المتكررة، يُنصح بإعداد خطة دعم فردية',
                priority: 'high',
                actionable: true
            }
        ],
        studentAlerts: [
            { name: 'أحمد', reason: 'ملاحظات سلوكية متكررة', count: 3 },
            { name: 'خالد', reason: 'تراجع في التحصيل', count: 2 }
        ]
    };
}

function mockAdminInsights(): AdminInsight[] {
    return [
        {
            id: '1',
            type: 'prediction',
            severity: 'high',
            title: 'توقع انخفاض الأداء',
            description: 'مدرسة الأمل تظهر مؤشرات انخفاض متوقع بنسبة 15% الأسبوع القادم',
            entityType: 'school',
            entityId: 's-003',
            entityName: 'مدرسة الأمل',
            metric: { current: 78, predicted: 66, change: -15 },
            createdAt: Date.now()
        },
        {
            id: '2',
            type: 'trend',
            severity: 'medium',
            title: 'ارتفاع ملاحظات السلوك',
            description: 'زيادة 40% في ملاحظات السلوك السلبي في مدارس المنطقة الشرقية',
            entityType: 'school',
            entityId: 'region-east',
            entityName: 'المنطقة الشرقية',
            createdAt: Date.now() - 3600000
        },
        {
            id: '3',
            type: 'opportunity',
            severity: 'low',
            title: 'تحسن ملحوظ',
            description: 'مدرسة الفجر حققت تحسناً بنسبة 12% - يُنصح بمشاركة تجربتها',
            entityType: 'school',
            entityId: 's-001',
            entityName: 'مدرسة الفجر',
            metric: { current: 92, predicted: 95, change: 12 },
            createdAt: Date.now() - 7200000
        }
    ];
}

// --- AI Service Class ---

class AIService {
    private cache = new Map<string, { data: any; timestamp: number }>();
    private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    private getCached<T>(key: string): T | null {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data as T;
        }
        return null;
    }

    private setCache(key: string, data: any) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    async analyzeNote(text: string): Promise<AIAnalysis> {
        if (!text || text.trim().length < 10) {
            return {
                sentiment: 'neutral',
                sentimentScore: 0,
                topics: [],
                entities: [],
                suggestions: [],
                concerns: [],
                confidence: 0
            };
        }

        const cacheKey = `note:${text.slice(0, 50)}`;
        const cached = this.getCached<AIAnalysis>(cacheKey);
        if (cached) return cached;

        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 500)); // Simulate latency
            const result = mockAnalyzeNote(text);
            this.setCache(cacheKey, result);
            return result;
        }

        // Real API call
        const response = await fetch(`${AI_API_URL}/api/ai/analyze-note`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (!response.ok) throw new Error('AI analysis failed');
        
        const result = await response.json();
        this.setCache(cacheKey, result);
        return result;
    }

    async getWeeklySummary(teacherId: string): Promise<WeeklySummary> {
        const cacheKey = `weekly:${teacherId}`;
        const cached = this.getCached<WeeklySummary>(cacheKey);
        if (cached) return cached;

        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 700));
            const result = mockWeeklySummary(teacherId);
            this.setCache(cacheKey, result);
            return result;
        }

        const response = await fetch(`${AI_API_URL}/api/ai/weekly-summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teacherId })
        });

        if (!response.ok) throw new Error('Weekly summary failed');
        
        const result = await response.json();
        this.setCache(cacheKey, result);
        return result;
    }

    async getAdminInsights(schoolId?: string): Promise<AdminInsight[]> {
        const cacheKey = `admin:${schoolId || 'all'}`;
        const cached = this.getCached<AdminInsight[]>(cacheKey);
        if (cached) return cached;

        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 600));
            const result = mockAdminInsights();
            this.setCache(cacheKey, result);
            return result;
        }

        const response = await fetch(`${AI_API_URL}/api/ai/admin-insights`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schoolId })
        });

        if (!response.ok) throw new Error('Admin insights failed');
        
        const result = await response.json();
        this.setCache(cacheKey, result);
        return result;
    }

    async getRecommendations(reportData: any): Promise<Recommendation[]> {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 400));
            return [
                {
                    id: '1',
                    type: 'teaching',
                    title: 'استخدم التعلم التعاوني',
                    description: 'قسّم الطلاب لمجموعات صغيرة لتحسين التفاعل',
                    priority: 'medium',
                    actionable: true
                },
                {
                    id: '2',
                    type: 'management',
                    title: 'نظام النقاط التحفيزية',
                    description: 'طبّق نظام مكافآت لتحسين الانضباط',
                    priority: 'high',
                    actionable: true
                }
            ];
        }

        const response = await fetch(`${AI_API_URL}/api/ai/recommendations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reportData })
        });

        if (!response.ok) throw new Error('Recommendations failed');
        return response.json();
    }

    clearCache() {
        this.cache.clear();
    }
}

export const aiService = new AIService();
