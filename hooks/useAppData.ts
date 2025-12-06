import { useState, useEffect } from 'react';
import { ListData, ChartData, ReportData } from '../types';
import { MOCK_DATA } from '../constants';
import { loadData } from '../dataManager';

export function useAppData(report: ReportData, handleClassChange: (classType: 'firstClass' | 'secondClass', field: any, value: any) => void) {
    const [appData, setAppData] = useState<ListData>(MOCK_DATA);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
    const [statsData, setStatsData] = useState<ChartData[]>([]);

    // Load Google Sheets data
    useEffect(() => {
        loadData()
            .then(data => {
                setAppData(data);
                setIsLoadingData(false);
            })
            .catch(error => {
                console.error('Failed to load data:', error);
                setIsLoadingData(false);
            });
    }, []);

    // Effect to update subjects and stats when level changes
    useEffect(() => {
        if (report && report.general && report.general.level) {
            const subjects = appData.subjects[report.general.level] || [];
            setAvailableSubjects(subjects);
            
            // Load Live Stats from Engine
            import('../services/statistics.engine').then(({ statsEngine }) => {
                statsEngine.calculateLiveStats().then(liveStats => {
                    console.log('📊 Live Stats Calculated:', liveStats);
                    if (liveStats.subjectDistribution.length > 0) {
                        setStatsData(liveStats.subjectDistribution);
                    } else {
                        // Fallback to empty structure if no reports yet, or keep partial mocks?
                        // Let's keep empty array to show "No Data" state or initial state
                         setStatsData([]);
                    }
                });
            });

            // Reset subject selections if they are no longer valid
            const validSubjects = appData.subjects[report.general.level] || [];
            if (report.firstClass.subject && !validSubjects.includes(report.firstClass.subject)) {
                handleClassChange('firstClass', 'subject', '');
                handleClassChange('firstClass', 'lesson', '');
            }
            if (report.secondClass.subject && !validSubjects.includes(report.secondClass.subject)) {
                handleClassChange('secondClass', 'subject', '');
                handleClassChange('secondClass', 'lesson', '');
            }
        } else {
            setAvailableSubjects([]);
            setStatsData([]);
        }
    }, [report.general.level, appData, report.general.date]); // Added date dependency to trigger on report save/change implicitly? 
    // Ideally we want to trigger on "Report Saved". 
    // Since useAppData depends on 'report', it might re-run often. 
    // We should optimize this, perhaps move stats to a separate hook or context.
    // For now, this fits fully within "React + Hooks" paradigm.

    return {
        appData,
        isLoadingData,
        availableSubjects,
        statsData
    };
}
