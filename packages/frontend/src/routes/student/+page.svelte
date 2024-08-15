<script lang="ts">
  import type { PageData } from "./$types";
  import { Ellipsis, LoaderCircle } from "lucide-svelte/icons";
  import { Button } from "@/components/ui/button";
  import * as Card from "@/components/ui/card";
  import { Skeleton } from "@/components/ui/skeleton";
  import { Badge } from "@/components/ui/badge";
  import * as DropdownMenu from "@/components/ui/dropdown-menu";
  import * as Table from "@/components/ui/table";
  import {
    getStudentClassAttendances,
    signoutStudentClassAttendance,
  } from "@/service";
  import type {
    StudentClassAttendanceSortByOption,
    StudentClassAttendanceModel,
    StudentClassAttendanceFilterByOption,
  } from "@/service";
  import { formatDate } from "date-fns";
  import { onDestroy, onMount } from "svelte";
  import {
    getCurrentPosition,
    showDialogToast,
    sleep,
    watchPosition,
  } from "@/utils";
  import SortWorker from "@/web-workers/sort?worker";
  import {
    SessionAlertDialog,
    ClassAttendanceDialog,
    ClassAttendanceSigninDialog,
  } from "@/components/dialog";
  import { SortByMenu, FilterByMenu } from "@/components/menu";
  import { toast } from "svelte-sonner";

  export let data: PageData;

  async function onSignout() {
    let toastId = toast.loading("Class attendance signing out...");

    try {
      let serviceResponse = await signoutStudentClassAttendance({
        accessToken: data.session.accessToken,
      });

      toast.dismiss(toastId);
      if (serviceResponse.error) {
        showDialogToast(
          "ERROR",
          "Request failed",
          serviceResponse.error.message
        );
      } else {
        showDialogToast(
          "ERROR",
          "Request successful",
          `Class attendance successfully signed out`
        );
        data.signedClassAttendance = null;
        await initializeData();
      }
    } catch (error) {
      toast.dismiss(toastId);
      showDialogToast("ERROR", "Request failed", "Unexpected error");
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
      type: "STUDENT_CLASS_ATTENDANCE",
      mode: "REQUEST",
      payload: classAttendances,
      sortOptions: sortBy,
    });
  }

  async function onLoadMore() {
    requestOngoing = true;
    await sleep(500);
    try {
      if (!position) return;
      await loadData(currentPage);
      currentPage += 1;

      if (sortWorker) {
        sortWorker.postMessage({
          type: "STUDENT_CLASS_ATTENDANCE",
          mode: "REQUEST",
          payload: classAttendances,
          sortOptions: sortBy,
        });
      }
    } catch (error) {
      sessionAlertDialog.show();
    } finally {
      requestOngoing = false;
    }
  }

  async function loadData(page: number = 1) {
    let serviceResponse = await getStudentClassAttendances({
      accessToken: data.session.accessToken,
      filter: filterBy,
      sort: sortBy,
      count: 25,
      page,
      latitude: (position as GeolocationPosition).coords.latitude,
      longitude: (position as GeolocationPosition).coords.longitude,
      currentTimestamp: new Date().toISOString(),
    });

    if (serviceResponse.data) {
      classAttendances = [...classAttendances, ...serviceResponse.data];
      return;
    } else {
      throw new Error(JSON.stringify(serviceResponse.error));
    }
  }

  async function initializeData() {
    classAttendances = [];
    initialDataLoaded = false;
    currentPage = 1;
    position = null;
    try {
      position = await getCurrentPosition();
      if (!position) return;
      await loadData(currentPage);
      currentPage += 1;

      if (!positionWatcherId) {
        // positionWatcherId = await watchPosition(async (_position) => {
        //   console.log("get position");
        //   if (showReloadBtn && !initialDataLoaded) return;
        //   position = _position;
        //   await initializeData();
        //   showDialogToast(
        //     "SUCCESS",
        //     "Request successful",
        //     "Retrieve class attendance records at your new location"
        //   );
        // });
      }
    } catch (e) {
      if (e instanceof GeolocationPositionError) {
        showDialogToast(
          "ERROR",
          "Request failed",
          e.PERMISSION_DENIED == GeolocationPositionError.PERMISSION_DENIED
            ? "User denied geolocation access"
            : e.POSITION_UNAVAILABLE ==
                GeolocationPositionError.POSITION_UNAVAILABLE
              ? "Location information unavailable"
              : e.TIMEOUT == GeolocationPositionError.TIMEOUT
                ? "Location request timed out"
                : "Unexpected error"
        );
      } else {
        sessionAlertDialog.show();
      }
    } finally {
      initialDataLoaded = true;
    }
  }

  async function onSearch() {
    await initializeData();
  }

  async function onResetSearch() {
    filterBy = {
      courseTitle: String(),
      courseCode: String(),
      lecturerName: String(),
      session: String(),
      semester: String(),
      level: String(),
      department: String(),
      faculty: String(),
    };
    await initializeData();
  }

  const sortOptions = [
    { name: "Course title", value: "courseTitle" },
    { name: "Course code", value: "courseCode" },
    { name: "Lecturer name", value: "lecturerName" },
    { name: "Session", value: "session" },
    { name: "Semester", value: "semester" },
    { name: "Level", value: "level" },
    { name: "Department", value: "department" },
    { name: "Faculty", value: "faculty" },
    { name: "Date created", value: "createdAt" },
    { name: "Last modified", value: "updatedAt" },
  ];

  let sortBy: StudentClassAttendanceSortByOption = {
    by: "createdAt",
    ascending: true,
  };
  let filterBy: StudentClassAttendanceFilterByOption = {
    courseTitle: String(),
    courseCode: String(),
    lecturerName: String(),
    session: String(),
    semester: String(),
    level: String(),
    department: String(),
    faculty: String(),
  };
  let filterScheme: { [name: string]: App.FilterByScheme } = {
    courseTitle: {
      label: "Course title",
      type: "text",
    },
    lecturerName: {
      label: "Lecturer name",
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
  let classAttendances: StudentClassAttendanceModel[] = [];
  let currentPage = 1;
  let requestOngoing = false;
  let initialDataLoaded = false;
  let sortWorker: Worker;
  let sessionAlertDialog: SessionAlertDialog;
  let classAttendanceDialog: ClassAttendanceDialog;
  let classAttendanceSigninDialog: ClassAttendanceSigninDialog;
  let position: GeolocationPosition | null = null;
  let showReloadBtn = false;
  let positionWatcherId: number | null = null;
  onMount(async () => {
    sortWorker = new SortWorker();
    sortWorker.addEventListener("message", (e) => {
      const { type, payload, mode } = e.data;
      if (type == "STUDENT_CLASS_ATTENDANCE" && mode == "RESPONSE") {
        classAttendances = payload;
      }
    });

    await initializeData();
    showReloadBtn = true;
  });
  onDestroy(() => {
    if (!positionWatcherId) return;

    navigator.geolocation.clearWatch(positionWatcherId);
  });
</script>

{#if data.signedClassAttendance}
  <Card.Root class="mb-3 md:mb-8">
    <Card.Header class="pb-2">
      <Card.Description class="flex justify-between items-center">
        Current class
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
              on:click={() =>
                data.signedClassAttendance &&
                classAttendanceDialog.show("VIEW", data.signedClassAttendance)}
            >
              View
            </DropdownMenu.Item>
            <DropdownMenu.Item on:click={async () => await onSignout()}>
              Sign out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Card.Description>
      <Card.Title class="text-4xl">
        {data.signedClassAttendance.courseTitle}
      </Card.Title>
    </Card.Header>
    <Card.Content>
      <div class="text-muted-foreground flex justify-between items-center">
        <span>
          {data.signedClassAttendance.courseCode} &CenterDot;
          {data.signedClassAttendance.session}
        </span>
        <span>
          {formatDate(data.signedClassAttendance.startTime, "hh:mm aaa")} -
          {formatDate(data.signedClassAttendance.endTime, "hh:mm aaa")}
        </span>
      </div>
    </Card.Content>
  </Card.Root>
{/if}

<div class="flex items-center gap-1 justify-between mb-3">
  <Button
    disabled={!initialDataLoaded}
    on:click={async () => await initializeData()}
    class="h-9 gap-1.5 {!showReloadBtn && 'hidden'}"
  >
    <LoaderCircle class="h-3.5 w-3.5 {!initialDataLoaded && 'animate-spin'}" />
    <span class="sr-only sm:not-sr-only sm:whitespace-nowrap"
      >{initialDataLoaded ? "Reload" : "Reloading..."}</span
    >
  </Button>
  <Skeleton class="h-9 w-24 {showReloadBtn && 'hidden'}" />
  <div>
    <SortByMenu {sortBy} {sortOptions} {onSortBy} />
    <FilterByMenu
      bind:filterByValue={filterBy}
      filterByScheme={filterScheme}
      description="Find class attendances with these properties."
      {onSearch}
      {onResetSearch}
    />
  </div>
</div>

<Card.Root>
  <Card.Header class="px-7">
    <Card.Title>Class attendances</Card.Title>
    <Card.Description>
      {classAttendances.length}
      {classAttendances.length > 1 ? "Class attendances" : "Class attendance"} found
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
          <Table.Head class="min-w-72 max-w-72 truncate">
            Lecturer name
          </Table.Head>
          <Table.Head class="min-w-[115px]">Date</Table.Head>
          <Table.Head class="min-w-28">Start time</Table.Head>
          <Table.Head class="min-w-28">End time</Table.Head>
          <Table.Head class="min-w-28 max-w-28 truncate">Semester</Table.Head>
          <Table.Head class="min-w-24 max-w-24 truncate">Level</Table.Head>
          <Table.Head class="min-w-28 max-w-28 truncate">Session</Table.Head>
          <Table.Head class="min-w-[215px] max-w-[215px] truncate">
            Department
          </Table.Head>
          <Table.Head class="min-w-[215px] max-w-[215px] truncate">
            Faculty
          </Table.Head>
          <Table.Head class="min-w-[115px]">Created at</Table.Head>
          <Table.Head class="min-w-[115px]">Modified at</Table.Head>
          <Table.Head class="w-[25px]">
            <div class="w-4"></div>
          </Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body class={initialDataLoaded ? "visible" : "hidden"}>
        {#each classAttendances as classAttendance, _ (classAttendance.id)}
          <Table.Row>
            <Table.Cell class="min-w-72 max-w-72 truncate">
              {classAttendance.courseTitle}
            </Table.Cell>
            <Table.Cell class="min-w-28 max-w-28 truncate">
              {classAttendance.courseCode}
            </Table.Cell>
            <Table.Cell class="min-w-72 max-w-72 truncate">
              {classAttendance.lecturerName}
            </Table.Cell>
            <Table.Cell class="min-w-[115px]">
              {formatDate(classAttendance.date, "yyy-LL-dd")}
            </Table.Cell>
            <Table.Cell class="min-w-28">
              {formatDate(classAttendance.startTime, "hh:mm aaa")}
            </Table.Cell>
            <Table.Cell class="min-w-28">
              {formatDate(classAttendance.endTime, "hh:mm aaa")}
            </Table.Cell>

            <Table.Cell class="min-w-28 max-w-28 truncate">
              <Badge variant="default">
                {classAttendance.semester}
              </Badge>
            </Table.Cell>
            <Table.Cell class="min-w-24 max-w-24 truncate">
              <Badge variant="outline">
                {classAttendance.level.replace("L_", String())}L
              </Badge>
            </Table.Cell>
            <Table.Cell class="min-w-28 max-w-28 truncate">
              {classAttendance.session}
            </Table.Cell>
            <Table.Cell class="min-w-[215px] max-w-[215px] truncate">
              {classAttendance.department}
            </Table.Cell>
            <Table.Cell class="min-w-[215px] max-w-[215px] truncate">
              {classAttendance.faculty}
            </Table.Cell>
            <Table.Cell class="min-w-[115px]">
              {formatDate(classAttendance.createdAt, "yyy-LL-dd")}
            </Table.Cell>
            <Table.Cell class="min-w-[115px]">
              {formatDate(classAttendance.updatedAt, "yyy-LL-dd")}
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
                    on:click={() =>
                      classAttendanceDialog.show("VIEW", classAttendance)}
                    >View</DropdownMenu.Item
                  >
                  <DropdownMenu.Item
                    disabled={data.signedClassAttendance ? true : false}
                    on:click={() =>
                      classAttendanceSigninDialog.show(classAttendance)}
                  >
                    Sign in
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    disabled={data.signedClassAttendance
                      ? classAttendance.id != data.signedClassAttendance.id
                      : true}
                    on:click={async () => await onSignout()}
                  >
                    Sign out
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
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
            <Table.Cell><Skeleton class="h-4 w-full" /></Table.Cell>
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
  {#if classAttendances.length == 0 && initialDataLoaded && !requestOngoing}
    <div
      class="w-full px-7 py-6 pt-0 flex justify-center text-sm text-muted-foreground font-semibold italic"
    >
      No class attendance found
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
<ClassAttendanceDialog
  userType="STUDENT"
  accessToken={data.session.accessToken}
  on:sessionError={() => sessionAlertDialog.show()}
  bind:this={classAttendanceDialog}
/>
<ClassAttendanceSigninDialog
  bind:this={classAttendanceSigninDialog}
  accessToken={data.session.accessToken}
  on:successful={async (e) => {
    data.signedClassAttendance = e.detail.classAttendanceData;
    await initializeData();
  }}
/>
