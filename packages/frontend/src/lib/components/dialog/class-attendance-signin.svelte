<script lang="ts">
  import { LoaderCircle, ChevronsUpDown, Check } from "lucide-svelte/icons";
  import { getCurrentPosition, showDialogToast } from "@/utils";
  import * as Sheet from "@/components/ui/sheet";
  import * as Command from "@/components/ui/command";
  import * as Popover from "@/components/ui/popover";
  import {
    getCourses,
    signinStudentClassAttendance,
    type CourseModel,
    type StudentClassAttendanceModel,
  } from "@/service";
  import { cn } from "@/utils.js";
  import { Button } from "@/components/ui/button";
  import { createEventDispatcher, tick } from "svelte";
  import { Label } from "@/components/ui/label";
  import FaceRecognitionDialog from "./face-recognition.svelte";
  import { toast } from "svelte-sonner";

  export let accessToken: string;

  export function show(data: StudentClassAttendanceModel) {
    classAttendanceData = structuredClone(data);

    open = true;

    getCourses({
      accessToken,
      count: "all",
    })
      .then(({ data }) => {
        courses = data || [];
      })
      .catch(() => {
        courses = courses || [];
      })
      .finally(() => {
        coursesLoaded = true;
      });
  }

  export function close() {
    internalClose();
    open = false;
  }

  function internalClose() {
    classAttendanceData = {};
    courses = [];
    coursesLoaded = false;
  }

  function onCrashCourseSelected(courseTitle: string, courseCode: string) {
    classAttendanceData.crashCourseTitle = courseTitle;
    classAttendanceData.crashCourseCode = courseCode;
    coursePopoverOpen = false;
  }

  function closeAndFocusTrigger(triggerId: string) {
    tick().then(() => {
      document.getElementById(triggerId)?.focus();
    });
  }

  async function onFaceRecognized() {
    let toastId = toast.loading("Class attendance signing in...");

    try {
      let position = await getCurrentPosition();

      let serviceRequest = await signinStudentClassAttendance({
        accessToken: accessToken,
        classAttendanceId: classAttendanceData.id as string,
        latitude: (position as GeolocationPosition).coords.latitude,
        longitude: (position as GeolocationPosition).coords.longitude,
        currentTimestamp: new Date().toISOString(),
      });

      toast.dismiss(toastId);
      if (serviceRequest.error) {
        requestOngoing = false;
        close();

        if (
          serviceRequest.error.code >= 1001 &&
          serviceRequest.error.code < 1004
        ) {
          dispatch("sessionError");
        } else {
          showDialogToast(
            "ERROR",
            "Request failed",
            serviceRequest.error.message
          );
        }
        return;
      }

      showDialogToast(
        "SUCCESS",
        "Request successful",
        `Class attendance successfully signed in`
      );
      dispatch("successful", { classAttendanceData });
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
        showDialogToast("ERROR", "Request failed", "Unexpected error");
      }
    }

    close();
  }

  async function onSignin() {
    open = false;
    requestOngoing = true;
    await faceRecognitionDialog.recognize();

    requestOngoing = false;
  }

  let classAttendanceData: Partial<
    StudentClassAttendanceModel &
      Record<"crashCourseCode" | "crashCourseTitle" | "crashCourseId", string>
  > = {};
  let open = false;
  let requestOngoing: boolean = false;
  let coursePopoverOpen = false;
  let coursesLoaded = false;
  let courses: CourseModel[] = [];
  let faceRecognitionDialog: FaceRecognitionDialog;
  let dispatch = createEventDispatcher();

  let dialogTitle = "Sign in to class attendance";
  let dialogDescription =
    "Sign in to the class attendance here. Click add when you're done.";
</script>

<Sheet.Root
  bind:open
  onOpenChange={(open) => {
    if (!open) {
      internalClose();
    }
  }}
>
  <Sheet.Content side="right" class="overflow-auto">
    <Sheet.Header>
      <Sheet.Title>{dialogTitle}</Sheet.Title>
      <Sheet.Description>{dialogDescription}</Sheet.Description>
    </Sheet.Header>
    <form class="grid items-start gap-4 mt-4">
      <div class="grid gap-2">
        <Label>Course crash</Label>
        <Popover.Root bind:open={coursePopoverOpen} let:ids>
          <Popover.Trigger asChild let:builder>
            <Button
              builders={[builder]}
              variant="outline"
              role="combobox"
              aria-expanded={coursePopoverOpen}
              class="w-full h-fit justify-between font-normal {classAttendanceData.crashCourseCode ==
                undefined && 'text-muted-foreground'}"
            >
              {#if classAttendanceData.crashCourseCode}
                <div class="grid gap-1" style="width: calc(100% - 20px)">
                  <p class="truncate text-left">
                    {classAttendanceData.crashCourseTitle}
                  </p>
                  <p class="text-sm text-muted-foreground truncate text-left">
                    {classAttendanceData.crashCourseCode}
                  </p>
                </div>
              {:else}
                Select course
              {/if}
              <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </Popover.Trigger>
          <Popover.Content class="p-0" style="width: calc(100% - 3rem)">
            <Command.Root loop>
              <Command.Input placeholder="Search student..." />
              <Command.List>
                {#if coursesLoaded}
                  <Command.Empty>No course found.</Command.Empty>
                  <Command.Group class="overflow-auto max-h-52">
                    {#each courses as course}
                      <Command.Item
                        onSelect={() => {
                          classAttendanceData.crashCourseId = course.id;
                          onCrashCourseSelected(course.title, course.code);
                          closeAndFocusTrigger(ids.trigger);
                        }}
                        value={`${course.code} ${course.title}`}
                      >
                        <Check
                          class={cn(
                            "mr-2 h-4 w-4",
                            course.code !==
                              classAttendanceData.crashCourseCode &&
                              "text-transparent"
                          )}
                        />
                        <div
                          style="width: calc(100% - 20px)"
                          class="grid gap-1"
                        >
                          <span>{course.title}</span>
                          <span class="text-sm text-muted-foreground">
                            {course.code}
                          </span>
                        </div>
                      </Command.Item>
                    {/each}
                  </Command.Group>
                {:else}
                  <Command.Loading class="py-6 text-center text-sm">
                    Loading courses...
                  </Command.Loading>
                {/if}
              </Command.List>
            </Command.Root>
          </Popover.Content>
        </Popover.Root>
      </div>
      <Button type="submit" on:click={onSignin} disabled={requestOngoing}>
        <LoaderCircle
          class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
        />
        {!requestOngoing ? "Sign in" : "Please wait"}
      </Button>
    </form>
  </Sheet.Content>
</Sheet.Root>

<FaceRecognitionDialog
  {accessToken}
  bind:this={faceRecognitionDialog}
  on:exit={close}
  on:successful={onFaceRecognized}
/>
