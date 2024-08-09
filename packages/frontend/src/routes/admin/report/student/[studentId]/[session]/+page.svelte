<script lang="ts">
  import type { PageData } from "./$types";
  import { Download, Ellipsis, LoaderCircle } from "lucide-svelte/icons";
  import { Button } from "@/components/ui/button";
  import * as Card from "@/components/ui/card";
  import { Skeleton } from "@/components/ui/skeleton";
  import { Badge } from "@/components/ui/badge";
  import * as Table from "@/components/ui/table";
  import * as DropdownMenu from "@/components/ui/dropdown-menu";
  import {
    generateStudentReport,
    generateStudentReportDownloadLink,
  } from "@/service";
  import type {
    StudentReportFilterByOption,
    StudentReportSortByOption,
    StudentReportDetail,
    StudentReportMetadata,
  } from "@/service";
  import { StudentReportDialog, SessionAlertDialog } from "@/components/dialog";
  import { onMount } from "svelte";
  import SortWorker from "@/web-workers/sort?worker";
  import { SortByMenu, FilterByMenu } from "@/components/menu";
  import { sleep } from "@/utils";
  import { formatDate } from "date-fns";

  export let data: PageData;

  function onDownload() {
    let link = generateStudentReportDownloadLink({
      filter: filterBy,
      studentId: data.student.id,
      sort: sortBy,
      session: encodeURIComponent(data.academicSession),
    });

    let linkElem = document.createElement("a");
    linkElem.target = "_blank";
    linkElem.rel = "noopener noreferrer";
    linkElem.href = link;
    linkElem.click();
  }

  function onSortBy(by: string) {
    if (!sortWorker) return;

    if (sortBy.by != by) {
      sortBy.ascending = true;
      sortBy.by = by as any;
    } else {
      sortBy.ascending = !sortBy.ascending;
    }

    sortWorker.postMessage({
      type: "STUDENT_REPORT",
      mode: "REQUEST",
      payload: reports,
      sortOptions: sortBy,
    });
  }

  async function onLoadMore() {
    requestOngoing = true;
    await sleep(500);
    try {
      await loadData(currentPage);
      requestOngoing = false;
      currentPage += 1;

      if (sortWorker) {
        sortWorker.postMessage({
          type: "STUDENT_REPORT",
          mode: "REQUEST",
          payload: reports,
          sortOptions: sortBy,
        });
      }
    } catch (error) {
      sessionAlertDialog.show();
    }
  }

  async function loadData(page: number = 1) {
    let serviceResponse = await generateStudentReport({
      accessToken: data.session.accessToken,
      studentId: data.student.id,
      session: encodeURIComponent(data.academicSession),
      filter: filterBy,
      sort: sortBy,
      count: 25,
      page,
    });

    if (serviceResponse.data) {
      reports = [...reports, ...serviceResponse.data.report];
      if (!initialDataLoaded) {
        reportMetadata = serviceResponse.data.metadata;
      }
      return;
    } else {
      throw new Error(JSON.stringify(serviceResponse.error));
    }
  }

  async function initializeData() {
    reports = [];
    initialDataLoaded = false;
    currentPage = 1;
    try {
      await loadData(currentPage);
      initialDataLoaded = true;
      currentPage += 1;
    } catch (error) {
      sessionAlertDialog.show();
    }
  }

  async function onSearch() {
    await initializeData();
  }

  async function onResetSearch() {
    filterBy = {
      courseTitle: String(),
      courseCode: String(),
      semester: String(),
    };
    await initializeData();
  }

  const sortOptions = [
    { name: "Course title", value: "courseTitle" },
    { name: "Course code", value: "courseCode" },
    { name: "Semester", value: "semester" },
  ];

  let sortBy: StudentReportSortByOption = {
    by: "semester",
    ascending: true,
  };
  let filterBy: StudentReportFilterByOption = {
    courseTitle: String(),
    courseCode: String(),
    semester: String(),
  };
  let filterScheme: { [name: string]: App.FilterByScheme } = {
    courseTitle: {
      label: "Course title",
      type: "text",
    },
    courseCode: {
      label: "Course code",
      type: "text",
    },
    semester: {
      type: "select",
      options: ["FIRST", "SECOND"],
    },
  };
  let reports: StudentReportDetail[] = [];
  let currentPage = 1;
  let requestOngoing = false;
  let reportMetadata: Partial<StudentReportMetadata> = {};
  let initialDataLoaded = false;
  let sortWorker: Worker;
  let sessionAlertDialog: SessionAlertDialog;
  let studentReportDialog: StudentReportDialog;

  onMount(async () => {
    sortWorker = new SortWorker();
    sortWorker.addEventListener("message", (e) => {
      const { type, payload, mode } = e.data;
      if (type == "STUDENT_REPORT" && mode == "RESPONSE") {
        reports = payload;
      }
    });

    await initializeData();
  });
</script>

<svelte:head>
  <title>
    {data.student.regno} - {data.academicSession} | Report
  </title>
</svelte:head>

<div
  class="grid gap-3 mb-3 md:mb-8 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
>
  <Card.Root class="col-span-1 md:col-span-2">
    <Card.Header class="pb-2">
      <Card.Description>Student</Card.Description>
      <Card.Title class="text-4xl">
        {data.student.name}
      </Card.Title>
    </Card.Header>
    <Card.Content>
      <div class="text-muted-foreground">
        {data.student.regno}
      </div>
    </Card.Content>
  </Card.Root>
  <Card.Root class="col-span-1 md:col-span-2 lg:col-span-1">
    <Card.Header class="pb-2">
      <Card.Description>Session</Card.Description>
      <Card.Title class="text-4xl">
        {data.academicSession}
      </Card.Title>
    </Card.Header>
    <Card.Content>
      <div class="text-muted-foreground">
        {formatDate(new Date(), "iiii, do LLLL")}
      </div>
    </Card.Content>
  </Card.Root>
</div>

<div class="flex items-center gap-1 justify-between mb-3">
  <Button class="h-9 gap-1.5" on:click={onDownload}>
    <Download class="h-3.5 w-3.5" />
    <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
      Download Report
    </span>
  </Button>
  <div>
    <SortByMenu {sortBy} {sortOptions} {onSortBy} />
    <FilterByMenu
      bind:filterByValue={filterBy}
      filterByScheme={filterScheme}
      description="Find courses with these properties."
      {onSearch}
      {onResetSearch}
    />
  </div>
</div>
<Card.Root>
  <Card.Header class="px-7">
    <Card.Title>Courses offered</Card.Title>
    <Card.Description>
      {reports.length}
      {reports.length > 1 ? "Courses" : "Course"} found
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="min-w-72 max-w-72 truncate">
            Course title
          </Table.Head>
          <Table.Head class="min-w-28 max-w-28 truncate">
            Course code
          </Table.Head>
          <Table.Head class="min-w-28 max-w-28 truncate">Semester</Table.Head>
          <Table.Head class="min-w-36 max-w-36 truncate">
            Classes attended
          </Table.Head>
          <Table.Head class="min-w-36 max-w-36 truncate">Percentage</Table.Head>
          <Table.Head class="w-[25px]">
            <div class="w-4"></div>
          </Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body class={initialDataLoaded ? "visible" : "hidden"}>
        {#each reports as report, _ (report.id)}
          <Table.Row>
            <Table.Cell class="min-w-72 max-w-72 truncate">
              {report.courseTitle}
            </Table.Cell>
            <Table.Cell class="min-w-28 max-w-28 truncate">
              {report.courseCode}
            </Table.Cell>
            <Table.Cell class="min-w-28 max-w-28 truncate">
              <Badge variant="default">
                {report.semester}
              </Badge>
            </Table.Cell>
            <Table.Cell class="min-w-36 max-w-36 truncate">
              {report.classesAttended} / {report.totalClasses}
            </Table.Cell>
            <Table.Cell class="min-w-36 max-w-36 truncate">
              {report.classesAttendedPercentage.toFixed(2)}%
            </Table.Cell>
            <Table.Cell>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild let:builder>
                  <Button
                    aria-haspopup="true"
                    size="icon"
                    variant="ghost"
                    builders={[builder]}
                  >
                    <Ellipsis class="h-4 w-4" />
                    <span class="sr-only">Toggle menu</span>
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                  <DropdownMenu.Label>Actions</DropdownMenu.Label>
                  <DropdownMenu.Item
                    on:click={() => studentReportDialog.show(report)}
                  >
                    View
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </Table.Cell>
          </Table.Row>
        {/each}
        {#if requestOngoing}
          {#each { length: 2 } as _}
            <Table.Row>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell class="w-[25px]">
                <div class="flex w-full justify-center">
                  <Skeleton class="h-4 w-4" />
                </div>
              </Table.Cell>
            </Table.Row>
          {/each}
        {/if}
      </Table.Body>
      <Table.Body class={!initialDataLoaded ? "visible" : "hidden"}>
        {#each { length: 3 } as _}
          <Table.Row>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell class="w-[25px]">
              <div class="flex w-full justify-center">
                <Skeleton class="h-4 w-4" />
              </div>
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </Card.Content>
  {#if reports.length == 0 && initialDataLoaded && !requestOngoing}
    <div
      class="w-full px-7 py-6 pt-0 flex justify-center text-sm text-muted-foreground font-semibold italic"
    >
      No course found
    </div>
  {/if}
  <Card.Footer class="justify-center border-t p-4">
    <Skeleton class="h-7 w-[92px] {initialDataLoaded && 'hidden'}" />
    <Button
      disabled={requestOngoing}
      size="sm"
      variant="ghost"
      on:click={onLoadMore}
      class="gap-1  {!initialDataLoaded && 'hidden'}"
    >
      <LoaderCircle
        class="h-3.5 w-3.5 animate-spin {!requestOngoing && 'hidden'}"
      />
      {!requestOngoing ? "Load more" : "Loading..."}
    </Button>
  </Card.Footer>
</Card.Root>

<SessionAlertDialog bind:this={sessionAlertDialog} />
<StudentReportDialog bind:this={studentReportDialog} />
