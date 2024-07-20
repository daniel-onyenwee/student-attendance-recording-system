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
  import { getDepartments } from "@/service";
  import type {
    DepartmentSortByOption,
    DepartmentModel,
    DepartmentFilterByOption,
  } from "@/service";
  import { formatDate } from "date-fns";
  import { onMount } from "svelte";
  import { sleep } from "@/utils";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import * as Popover from "@/components/ui/popover";
  import SortWorker from "@/web-workers/sort?worker";
  import {
    SessionAlertDialog,
    DeleteRecordDialog,
    DepartmentRecordDialog,
  } from "@/components/dialog";

  export let data: PageData;

  function onDepartmentSelected(
    id: string,
    value: boolean | "indeterminate"
  ): void {
    if (value) {
      departmentsSelected.add(id);
    } else {
      departmentsSelected.delete(id);
    }

    departmentsSelected = departmentsSelected;
  }

  function onAllDepartmentsSelected(value: boolean | "indeterminate") {
    if (value) {
      departmentsSelected = new Set<string>(departments.map(({ id }) => id));
    } else {
      departmentsSelected = new Set<string>();
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
      type: "DEPARTMENT",
      mode: "REQUEST",
      payload: departments,
      sortOptions: sortBy,
    });

    departments = departments;
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
          type: "DEPARTMENT",
          mode: "REQUEST",
          payload: departments,
          sortOptions: sortBy,
        });
      }
    } catch (error) {
      sessionAlertDialog.show();
    }
  }

  async function loadData(page: number = 1) {
    let serviceResponse = await getDepartments({
      accessToken: data.session.accessToken,
      filter: filterBy,
      count: 25,
      page,
    });

    if (serviceResponse.data) {
      departments = [...departments, ...serviceResponse.data];
      return;
    } else {
      throw new Error(JSON.stringify(serviceResponse.error));
    }
  }

  async function initializeData() {
    departments = [];
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
    showSearchPopover = false;
    await initializeData();
  }

  async function onResetSearch() {
    showSearchPopover = false;
    filterBy = {
      name: String(),
      faculty: String(),
    };
    await initializeData();
  }

  async function onDeleteSuccessful() {
    departmentsSelected = new Set<string>();
    await initializeData();
  }

  function onFacultySelectedChange(e: any) {
    if (!e) return;

    filterBy.faculty = e.value;
  }

  const sortOptions = [
    { name: "Name", value: "name" },
    { name: "Faculty", value: "faculty" },
    { name: "Date created", value: "createdAt" },
    { name: "Last modified", value: "updatedAt" },
  ];

  let sortBy: DepartmentSortByOption = {
    by: "createdAt",
    ascending: true,
  };
  let filterBy: DepartmentFilterByOption = {
    name: String(),
    faculty: String(),
  };
  let departments: DepartmentModel[] = [];
  let currentPage = 1;
  let requestOngoing = false;
  let initialDataLoaded = false;
  let departmentsSelected = new Set<string>();
  let sortWorker: Worker;
  let sessionAlertDialog: SessionAlertDialog;
  let deleteRecordDialog: DeleteRecordDialog;
  let departmentRecordDialog: DepartmentRecordDialog;
  let showSearchPopover: boolean;

  onMount(async () => {
    sortWorker = new SortWorker();
    sortWorker.addEventListener("message", (e) => {
      const { type, payload, mode } = e.data;
      if (type == "DEPARTMENT" && mode == "RESPONSE") {
        departments = payload;
      }
    });

    await initializeData();
  });
</script>

<div class="flex items-center gap-1 justify-between mb-3">
  <Button
    on:click={() => departmentRecordDialog.show("CREATE", undefined)}
    class="h-9 gap-1.5  {departmentsSelected.size > 0 && 'hidden'}"
  >
    <CirclePlus class="h-3.5 w-3.5" />
    <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
      Add Department
    </span>
  </Button>
  <Button
    variant="destructive"
    on:click={() => deleteRecordDialog.show(Array.from(departmentsSelected))}
    class="h-9 gap-1  {departmentsSelected.size == 0 && 'hidden'}"
  >
    <Trash2 class="h-4 w-4" />
    <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">
      Delete {`(${departmentsSelected.size})`}
    </span>
  </Button>
  <div>
    <Popover.Root portal={null} bind:open={showSearchPopover}>
      <Popover.Trigger asChild let:builder>
        <Button builders={[builder]} variant="outline" class="gap-1.5 h-10">
          <Search class="h-3.5 w-3.5" />
          <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">Search</span
          >
        </Button>
      </Popover.Trigger>
      <Popover.Content class="w-80" align="end">
        <div class="grid gap-4">
          <div class="space-y-2">
            <h4 class="font-medium leading-none">Search</h4>
            <p class="text-sm text-muted-foreground">
              Find departments with these characteristics.
            </p>
          </div>
          <div class="grid gap-2">
            <div class="grid grid-rows-1 sm:grid-cols-3 items-center gap-4">
              <Label for="name">Name</Label>
              <Input
                bind:value={filterBy.name}
                id="name"
                class="col-span-2 h-8"
              />
            </div>
            <div class="grid grid-rows-1 sm:grid-cols-3 items-center gap-4">
              <Label for="name">Faculty</Label>
              <Input
                bind:value={filterBy.faculty}
                id="name"
                class="col-span-2 h-8"
              />
            </div>
          </div>
          <div class="flex mt-2 flex-row justify-between">
            <Button size="sm" on:click={onResetSearch} variant="outline"
              >Reset</Button
            >
            <Button size="sm" on:click={onSearch}>Search</Button>
          </div>
        </div>
      </Popover.Content>
    </Popover.Root>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild let:builder>
        <Button builders={[builder]} variant="outline" class="gap-1.5 h-10">
          <ListFilter class="h-3.5 w-3.5" />
          <span class="sr-only sm:not-sr-only sm:whitespace-nowrap">Sort</span>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content class="w-[150px]" align="end">
        <DropdownMenu.Label>Sort by</DropdownMenu.Label>
        <DropdownMenu.Separator />
        {#each sortOptions as option}
          <DropdownMenu.Item
            on:click={() => onSortBy(option.value)}
            class="flex justify-between items-center gap-3 {option.value ==
              sortBy.by && 'text-primary data-[highlighted]:text-primary'}"
          >
            {option.name}
            <ArrowUp
              class="mr-2 h-4 w-4 {sortBy.ascending
                ? option.value == sortBy.by
                  ? 'visible'
                  : 'invisible'
                : 'hidden'}"
            />
            <ArrowDown
              class="mr-2 h-4 w-4  {!sortBy.ascending
                ? option.value == sortBy.by
                  ? 'visible'
                  : 'invisible'
                : 'hidden'} "
            />
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>
</div>
<Card.Root>
  <Card.Header class="px-7">
    <Card.Title>Departments</Card.Title>
    <Card.Description>
      {departments.length}
      {departments.length > 1 ? "departments" : "department"} found
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head class="w-[35px]">
            <Checkbox
              onCheckedChange={onAllDepartmentsSelected}
              checked={departments.length > 0 &&
                departments.length == departmentsSelected.size}
            />
          </Table.Head>
          <Table.Head class="min-w-[215px]">Name</Table.Head>
          <Table.Head class="min-w-[215px]">Levels</Table.Head>
          <Table.Head class="min-w-[215px]">Faculty</Table.Head>
          <Table.Head class="min-w-[115px]">Created at</Table.Head>
          <Table.Head class="min-w-[115px]">Modified at</Table.Head>
          <Table.Head class="w-[25px]">
            <div class="w-4"></div>
          </Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body class={initialDataLoaded ? "visible" : "hidden"}>
        {#each departments as department, _ (department.id)}
          <Table.Row>
            <Table.Cell>
              <Checkbox
                checked={departmentsSelected.has(department.id)}
                onCheckedChange={(value) =>
                  onDepartmentSelected(department.id, value)}
              />
            </Table.Cell>
            <Table.Cell class="min-w-[215px]">
              {department.name}
            </Table.Cell>
            <Table.Cell class="min-w-[215px]">
              <div class="flex gap-3 justify-start flex-wrap">
                {#each department.levels as level}
                  <Badge variant="secondary">
                    {level.replace("L_", String())}
                  </Badge>
                {/each}
              </div>
            </Table.Cell>
            <Table.Cell class="min-w-[215px]">
              {department.faculty}
            </Table.Cell>
            <Table.Cell class="min-w-[115px]">
              {formatDate(department.createdAt, "yyy-LL-dd")}
            </Table.Cell>
            <Table.Cell class="min-w-[115px]">
              {formatDate(department.updatedAt, "yyy-LL-dd")}
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
                      departmentRecordDialog.show("UPDATE", department)}
                    >Edit</DropdownMenu.Item
                  >
                  <DropdownMenu.Item
                    on:click={() => deleteRecordDialog.show([department.id])}
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
          {#each new Array(2) as _}
            <Table.Row>
              <Table.Cell class="px-0 pl-4">
                <Skeleton class="h-4 w-4" />
              </Table.Cell>
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
        {#each new Array(3) as _}
          <Table.Row>
            <Table.Cell class="px-0 pl-4">
              <Skeleton class="h-4 w-full" />
            </Table.Cell>
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
  {#if departments.length == 0 && initialDataLoaded && !requestOngoing}
    <div
      class="w-full px-7 py-6 pt-0 flex justify-center text-sm text-muted-foreground font-semibold italic"
    >
      No department found
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
<DepartmentRecordDialog
  accessToken={data.session.accessToken}
  on:onSessionError={() => sessionAlertDialog.show()}
  on:onSuccessful={async () => await initializeData()}
  bind:this={departmentRecordDialog}
/>
<DeleteRecordDialog
  type="DEPARTMENT"
  accessToken={data.session.accessToken}
  on:onSessionError={() => sessionAlertDialog.show()}
  on:onSuccessful={onDeleteSuccessful}
  bind:this={deleteRecordDialog}
/>
