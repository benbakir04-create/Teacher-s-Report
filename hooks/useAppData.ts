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
            
            // Fixed curriculum list for the chart as requested
            const reportSubjects = ["القرآن", "التربية الإيمانية", "الفقه", "اللغة العربية", "أحكام التجويد", "التاريخ"];
            
            // Generate Mock Stats with fixed values for visualization if no real data
            const mockStats = reportSubjects.map(subj => {
                const total = Math.floor(Math.random() * 10) + 15; // 15-25
                const actual = Math.floor(Math.random() * total); // 0 to total
                return {
                    subject: subj,
                    total: total,
                    actual: actual,
                    percentage: Math.round((actual/total) * 100) + '%'
                };
            });
            setStatsData(mockStats);

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
    }, [report.general.level, appData]);

    return {
        appData,
        isLoadingData,
        availableSubjects,
        statsData
    };
}
