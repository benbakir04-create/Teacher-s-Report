import { dbService } from './db.service';
import { ChartData } from '../types';

export interface LiveStats {
    completionRate: number;
    topStrategy: string;
    notesDensity: number; // Avg chars per note
    subjectDistribution: ChartData[];
    totalReports: number;
}

export class StatisticsEngine {
    
    /**
     * Calculate stats from local IndexedDB reports
     * This is an "Instant" calculation that doesn't need network
     */
    async calculateLiveStats(): Promise<LiveStats> {
        try {
            // 1. Get ALL reports from local DB
            const reports = await dbService.getAllReports();
            
            // 2. Initialize counters
            const subjectCounts: Record<string, number> = {};
            const strategyCounts: Record<string, number> = {};
            let totalNotesChars = 0;
            let notesCount = 0;

            reports.forEach(report => {
                // Count Subjects (Class 1)
                const s1 = report.firstClass?.subject;
                if (s1) subjectCounts[s1] = (subjectCounts[s1] || 0) + 1;

                // Count Subjects (Class 2)
                if (report.hasSecondClass) {
                    const s2 = report.secondClass?.subject;
                    if (s2) subjectCounts[s2] = (subjectCounts[s2] || 0) + 1;
                }

                // Count Strategies
                report.firstClass?.strategies?.forEach((s: string) => {
                    strategyCounts[s] = (strategyCounts[s] || 0) + 1;
                });
                if (report.hasSecondClass) {
                    report.secondClass?.strategies?.forEach((s: string) => {
                        strategyCounts[s] = (strategyCounts[s] || 0) + 1;
                    });
                }

                // Count Notes Density
                if (report.notes) {
                    totalNotesChars += report.notes.length;
                    notesCount++;
                }
            });

            // 3. Transform to ChartData format
            const subjectDistribution: ChartData[] = Object.keys(subjectCounts).map(subject => {
                // Note: "Total" here should ideally come from curriculum plan. 
                // For now, we estimate or use a fixed baseline if available, or just show volume.
                // To match the UI requirement "Completion %", we need a "Target".
                // We will assume a default target of 30 lessons per subject per term for now.
                const count = subjectCounts[subject];
                const target = 30; // Implicit target
                
                return {
                    subject,
                    total: target, 
                    actual: count,
                    percentage: Math.min(100, Math.round((count / target) * 100)) + '%'
                };
            });

            // 4. Find Top Strategy
            let topStrategy = 'لا يوجد';
            let maxCount = 0;
            Object.entries(strategyCounts).forEach(([strat, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    topStrategy = strat;
                }
            });

            return {
                completionRate: 0, // Calculated in UI aggregation
                topStrategy,
                notesDensity: notesCount > 0 ? Math.round(totalNotesChars / notesCount) : 0,
                subjectDistribution,
                totalReports: reports.length
            };

        } catch (error) {
            console.error('Error calculating live stats:', error);
            return {
                completionRate: 0,
                topStrategy: 'Error',
                notesDensity: 0,
                subjectDistribution: [],
                totalReports: 0
            };
        }
    }
}

export const statsEngine = new StatisticsEngine();
