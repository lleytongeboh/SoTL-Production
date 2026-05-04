import { Gantt, Task, ViewMode } from "gantt-task-react";
import ContentPanel from "../../../components/ContentPanel";
import React, { useEffect } from "react";
import { ViewSwitcher } from "./ViewSwitcher";
import { Box } from "@mui/material";
import { useProject } from "../../../features/student/project/context/ProjectContext";
import { Project } from "../../../features/student/project/models";
import { projectHooks } from "../../../features/student/project/hooks/projectHooks";
import { useParams } from "react-router-dom";

const GanttChart: React.FC = () => {
    //const currentDate = new Date();
    // const initTasks: Task[] = [
    //     {
    //         start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
    //         end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 2),
    //         name: "Some Project",
    //         id: "ProjectSample",
    //         progress: 25,
    //         type: "project",
    //         hideChildren: false,
    //         styles: {
    //             backgroundColor: "#d32f2f",
    //             progressColor: "#f9a825",
    //         },
    //         displayOrder: 1,
    //     },
    //     {
    //         start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
    //         end: new Date(
    //             currentDate.getFullYear(),
    //             currentDate.getMonth(),
    //             2,
    //             12,
    //             28
    //         ),
    //         name: "Idea",
    //         id: "Task 0",
    //         progress: 45,
    //         type: "project",
    //         project: "ProjectSample",
    //         displayOrder: 2,
    //     },
    //     {
    //         start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 2),
    //         end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 4, 0, 0),
    //         name: "Research",
    //         id: "Task 1",
    //         progress: 25,
    //         dependencies: ["Task 0"],
    //         type: "task",
    //         project: "ProjectSample",
    //         displayOrder: 3,
    //     },
    //     {
    //         start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 4),
    //         end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8, 0, 0),
    //         name: "Discussion with team",
    //         id: "Task 2",
    //         progress: 10,
    //         dependencies: ["Task 1"],
    //         type: "task",
    //         project: "ProjectSample",
    //         displayOrder: 4,
    //     },
    //     {
    //         start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8),
    //         end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 9, 0, 0),
    //         name: "Developing",
    //         id: "Task 3",
    //         progress: 0,
    //         dependencies: ["Task 2"],
    //         type: "task",
    //         project: "ProjectSample",
    //         displayOrder: 5,
    //     },
    //     {
    //         start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8),
    //         end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10),
    //         name: "Review",
    //         id: "Task 4",
    //         type: "task",
    //         progress: 70,
    //         dependencies: ["Task 2"],
    //         project: "ProjectSample",
    //         displayOrder: 6,
    //     },
    //     {
    //         start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
    //         end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
    //         name: "Release",
    //         id: "Task 6",
    //         progress: currentDate.getMonth(),
    //         type: "milestone",
    //         dependencies: ["Task 4"],
    //         project: "ProjectSample",
    //         displayOrder: 7,
    //     },
    //     {
    //         start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 18),
    //         end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 19),
    //         name: "Party Time",
    //         id: "Task 9",
    //         progress: 100,
    //         isDisabled: true,
    //         type: "task",
    //     },
    // ];

    const { projectId } = useParams();
    const { selectedProject }: { selectedProject: Project | null } = useProject() ?? { selectedProject: null };
    const { fetchGantt, error, loading } = projectHooks();

    const [view, setView] = React.useState<ViewMode>(ViewMode.Day);
    const [isChecked, setIsChecked] = React.useState(true);
    const [tasks, setTasks] = React.useState<Task[] | null>(null);
    const [errorPopup, setErrorPopup] = React.useState(false);

    let columnWidth = 65;
    if (view === ViewMode.Year) {
        columnWidth = 350;
    } else if (view === ViewMode.Month) {
        columnWidth = 300;
    } else if (view === ViewMode.Week) {
        columnWidth = 250;
    }

    const handleExpanderClick = (task: Task) => {
        setTasks(tasks!.map(t => (t.id === task.id ? task : t)));
        console.log("On expander click Id:" + task.id);
    };

    const fetchData = async () => {
        try {
            const result = await fetchGantt(projectId ?? selectedProject!._id!);
            setTasks(result.map((t) => ({ ...t, start: new Date(t.start), end: new Date(t.end)})));
            //setTasks(initTasks);
        } catch (error) {
            console.error(error);
            setErrorPopup(true);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    return <>
        <ContentPanel
            title="Gantt Chart"
            hasBackButton
            backLink={-1}
            errorPopup={{
                open: errorPopup,
                onClose: () => setErrorPopup(false),
                content: error ?? "An error occurred",
            }}
            loadingPopup={{
                open: loading
            }}
            content={
                tasks && <Box width={'100%'}>
                    <ViewSwitcher
                        onViewModeChange={viewMode => setView(viewMode)}
                        onViewListChange={setIsChecked}
                        isChecked={isChecked}
                    />
                    <br />
                    <Gantt
                        tasks={tasks!}
                        viewMode={view}
                        onExpanderClick={handleExpanderClick}
                        listCellWidth={isChecked ? "155px" : ""}
                        columnWidth={columnWidth}
                    />
                </Box>
            }
        />
    </>
};

export default GanttChart;