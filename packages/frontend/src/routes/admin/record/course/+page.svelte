<script lang="ts">
  import type { PageData } from "./$types";
  import {
    ArrowDown,
    ArrowUp,
    CirclePlus,
    ListFilter,
    Ellipsis,
    LoaderCircle,
    Trash2,
    Search,
  } from "lucide-svelte/icons";
  import { Button } from "@/components/ui/button";
  import * as Card from "@/components/ui/card";
  import { Skeleton } from "@/components/ui/skeleton";
  import { Checkbox } from "@/components/ui/checkbox";
  import { Badge } from "@/components/ui/badge";
  import * as DropdownMenu from "@/components/ui/dropdown-menu";
  import * as Table from "@/components/ui/table";
  import { getCourses } from "@/service";
  import type {
    CourseSortByOption,
    CourseModel,
    CourseFilterByOption,
  } from "@/service";
  import { formatDate } from "date-fns";
  import { onMount } from "svelte";
  import { sleep } from "@/utils";
  import SortWorker from "@/web-workers/sort?worker";
  import {
    SessionAlertDialog,
    DeleteRecordDialog,
    CourseRecordDialog,
  } from "@/components/dialog";
  import { SortByMenu, FilterByMenu } from "@/components/menu";

  type FilterByScheme =
    | {
        type: "text" | "number";
      }
    | {
        type: "select";
        options: Array<{ label?: string; value: string }> | Array<string>;
      };

  export let data: PageData;

  function onCourseSelected(
    id: string,
    value: boolean | "indeterminate"
  ): void {
    if (value) {
      coursesSelected.add(id);
    } else {
      coursesSelected.delete(id);
    }

    coursesSelected = coursesSelected;
  }

  function onAllCoursesSelected(value: boolean | "indeterminate") {
    if (value) {
      coursesSelected = new Set<string>(courses.map(({ id }) => id));
    } else {
      coursesSelected = new Set<string>();
    }
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
      type: "COURSE",
      mode: "REQUEST",
      payload: courses,
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
          type: "COURSE",
          mode: "REQUEST",
          payload: courses,
          sortOptions: sortBy,
        });
      }
    } catch (error) {
      sessionAlertDialog.show();
    }
  }

  async function loadData(page: number = 1) {
    let serviceResponse = await getCourses({
      accessToken: data.session.accessToken,
      filter: filterBy,
      count: 25,
      page,
    });

    if (serviceResponse.data) {
      courses = [...courses, ...serviceResponse.data];
      return;
    } else {
      throw new Error(JSON.stringify(serviceResponse.error));
    }
  }

  async function initializeData() {
    courses = [];
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
      title: String(),
      code: String(),
      semester: String(),
      level: String(),
      department: String(),
      faculty: String(),
    };
    await initializeData();
  }

  async function onDeleteSuccessful() {
    coursesSelected = new Set<string>();
    await initializeData();
  }

  const sortOptions = [
    { name: "Title", value: "title" },
    { name: "Code", value: "code" },
    { name: "Semester", value: "semester" },
    { name: "Level", value: "level" },
    { name: "Department", value: "department" },
    { name: "Faculty", value: "faculty" },
    { name: "Date created", value: "createdAt" },
    { name: "Last modified", value: "updatedAt" },
  ];

  let sortBy: CourseSortByOption = {
    by: "createdAt",
    ascending: true,
  };
  let filterBy: CourseFilterByOption = {
    title: String(),
    code: String(),
    semester: String(),
    level: String(),
    department: String(),
    faculty: String(),
  };
  let filterScheme: { [name: string]: FilterByScheme } = {
    semester: {
      type: "select",
      options: ["FIRST", "SECOND"],
    },
    level: {
      type: "select",
      options: [
        { label: "100L", value: "L_100" },
        { label: "200L", value: "L_200" },
        { label: "300L", value: "L_300" },
        { label: "400L", value: "L_400" },
        { label: "500L", value: "L_500" },
        { label: "600L", value: "L_600" },
        { label: "700L", value: "L_700" },
        { label: "800L", value: "L_800" },
        { label: "900L", value: "L_900" },
        { label: "1000L", value: "L_1000" },
      ],
    },
  };
  let courses: CourseModel[] = [];
  let currentPage = 1;
  let requestOngoing = false;
  let initialDataLoaded = false;
  let coursesSelected = new Set<string>();
  let sortWorker: Worker;
  let sessionAlertDialog: SessionAlertDialog;
  let deleteRecordDialog: DeleteRecordDialog;
  let courseRecordDialog: CourseRecordDialog;

  onMount(async () => {
    sortWorker = new SortWorker();
    sortWorker.addEventListener("message", (e) => {
      const { type, payload, mode } = e.data;
      if (type == "COURSE" && mode == "RESPONSE") {
        courses = payload;
      }
    });

    await initializeData();
  });
</script>

<div class="flex items-center gap-1 justify-between mb-3">
  <Button
    on:click={() => courseRecordDialog.show("CREATE", undefined)}
    class="h-9 gap-1.5  {coursesSelected.size > 0 && 'hidden'}"
  >
    <CirclePlus class="h-3.5 w-3.5" />
    <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
      Add Course
    </span>
  </Button>
  <Button
    variant="destructive"
    on:click={() => deleteRecordDialog.show(Array.from(coursesSelected))}
    class="h-9 gap-1  {coursesSelected.size == 0 && 'hidden'}"
  >
    <Trash2 class="h-4 w-4" />
    <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
      Delete {`(${coursesSelected.size})`}
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
    <Card.Title>Courses</Card.Title>
    <Card.Description>
      {courses.length}
      {courses.length > 1 ? "courses" : "course"} found
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-[35px]">
            <Checkbox
              onCheckedChange={onAllCoursesSelected}
              checked={courses.length > 0 &&
                courses.length == coursesSelected.size}
            />
          </Table.Head>
          <Table.Head class="min-w-[360px]">Title</Table.Head>
          <Table.Head class="min-w-24">Code</Table.Head>
          <Table.Head class="min-w-28">Semester</Table.Head>
          <Table.Head class="min-w-20">Level</Table.Head>
          <Table.Head class="min-w-[215px]">Department</Table.Head>
          <Table.Head class="min-w-[215px]">Faculty</Table.Head>
          <Table.Head class="min-w-[115px]">Created at</Table.Head>
          <Table.Head class="min-w-[115px]">Modified at</Table.Head>
          <Table.Head class="w-[25px]">
            <div class="w-4"></div>
          </Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body class={initialDataLoaded ? "visible" : "hidden"}>
        {#each courses as course, _ (course.id)}
          <Table.Row>
            <Table.Cell>
              <Checkbox
                checked={coursesSelected.has(course.id)}
                onCheckedChange={(value) => onCourseSelected(course.id, value)}
              />
            </Table.Cell>
            <Table.Cell class="min-w-[360px]">
              {course.title}
            </Table.Cell>
            <Table.Cell class="min-w-20">
              {course.code}
            </Table.Cell>
            <Table.Cell class="min-w-28">
              <Badge variant="default">
                {course.semester}
              </Badge>
            </Table.Cell>
            <Table.Cell class="min-w-24">
              <Badge variant="outline">
                {course.level.replace("L_", String())}L
              </Badge>
            </Table.Cell>
            <Table.Cell class="min-w-[215px]">
              {course.department}
            </Table.Cell>
            <Table.Cell class="min-w-[215px]">
              {course.faculty}
            </Table.Cell>
            <Table.Cell class="min-w-[115px]">
              {formatDate(course.createdAt, "yyy-LL-dd")}
            </Table.Cell>
            <Table.Cell class="min-w-[115px]">
              {formatDate(course.updatedAt, "yyy-LL-dd")}
            </Table.Cell>
            <Table.Cell class="w-[25px]">
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
                    on:click={() => courseRecordDialog.show("UPDATE", course)}
                    >Edit</DropdownMenu.Item
                  >
                  <DropdownMenu.Item
                    on:click={() => deleteRecordDialog.show([course.id])}
                    class="text-red-600 data-[highlighted]:bg-red-400 dark:data-[highlighted]:bg-destructive data-[highlighted]:text-white"
                  >
                    Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </Table.Cell>
          </Table.Row>
        {/each}
        {#if requestOngoing}
          {#each { length: 2 } as _}
            <Table.Row>
              <Table.Cell class="px-0 pl-4">
                <Skeleton class="h-4 w-4" />
              </Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
              <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
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
            <Table.Cell class="px-0 pl-4">
              <Skeleton class="h-4 w-full" />
            </Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
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
  {#if courses.length == 0 && initialDataLoaded && !requestOngoing}
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
<CourseRecordDialog
  accessToken={data.session.accessToken}
  on:onSessionError={() => sessionAlertDialog.show()}
  on:onSuccessful={async () => await initializeData()}
  bind:this={courseRecordDialog}
/>
<DeleteRecordDialog
  type="COURSE"
  accessToken={data.session.accessToken}
  on:onSessionError={() => sessionAlertDialog.show()}
  on:onSuccessful={onDeleteSuccessful}
  bind:this={deleteRecordDialog}
/>
