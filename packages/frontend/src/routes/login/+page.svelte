<script lang="ts">
  import * as Card from "@/components/ui/card";
  import * as Select from "@/components/ui/select";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { LoaderCircle } from "lucide-svelte/icons";
  import { toast } from "svelte-sonner";
  import { login } from "@/service";
  import { goto } from "$app/navigation";

  interface UserDetail {
    type: "ADMIN" | "STUDENT" | "LECTURER";
    username: string;
    password: string;
  }

  function onSelectedChange(e: any) {
    if (!e) return;

    userDetail.type = e.value;
  }

  async function onContinue() {
    requestOngoing = true;

    userDetailErrorMessage = {};

    if (!userDetail.type) {
      userDetailErrorMessage.type = "Required field";
      requestOngoing = false;
      return;
    }

    if (!userDetail.username) {
      userDetailErrorMessage.username = "Required field";
      requestOngoing = false;
      return;
    }

    if (!userDetail.password) {
      userDetailErrorMessage.password = "Required field";
      requestOngoing = false;
      return;
    }

    try {
      let { error } = await login(userDetail as Required<UserDetail>);

      if (error) {
        if (error.code == 2004) {
          userDetailErrorMessage.username = `${userDetail.type == "STUDENT" ? "Regno" : "Username"} not found`;
        } else if (error.code == 2005) {
          userDetailErrorMessage.password = error.message;
        } else {
          toast.error("Request failed", {
            description: error.message,
          });
        }

        requestOngoing = false;
        return;
      }

      toast.success("Request successfully", {
        description: "Login successfully",
      });

      await goto("/");
    } catch (error) {
      toast.error("Request failed", {
        description: "Unexpected error",
      });
    }

    requestOngoing = false;
  }

  let userDetail: Partial<UserDetail> = {};
  let userDetailErrorMessage: Partial<Record<keyof UserDetail, string>> = {};
  let requestOngoing: boolean = false;
</script>

<svelte:head>
  <title>Login</title>
</svelte:head>

<main class="bg-muted/40 h-screen w-screen flex justify-center items-center">
  <Card.Root class="w-[350px]">
    <Card.Header>
      <Card.Title>Login</Card.Title>
      <Card.Description
        >Instant dashboard access with one-click.</Card.Description
      >
    </Card.Header>
    <Card.Content>
      <form>
        <div class="grid w-full items-center gap-4">
          <div class="flex flex-col space-y-1.5">
            <Label
              class={userDetailErrorMessage.type && "text-red-600"}
              for="userType">User role</Label
            >
            <Select.Root {onSelectedChange}>
              <Select.Trigger id="userType">
                <Select.Value placeholder="Select" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="ADMIN" label="Admin">Admin</Select.Item>
                <Select.Item value="LECTURER" label="Lecturer"
                  >Lecturer</Select.Item
                >
                <Select.Item value="STUDENT" label="Student"
                  >Student</Select.Item
                >
              </Select.Content>
            </Select.Root>
            <p
              class="text-sm font-medium text-red-600 {!userDetailErrorMessage.type &&
                'hidden'}"
            >
              {userDetailErrorMessage.type}
            </p>
          </div>
          <div class="flex flex-col space-y-1.5">
            <Label
              class={userDetailErrorMessage.username && "text-red-600"}
              for="username"
              >{userDetail.type == "STUDENT" ? "Regno" : "Username"}</Label
            >
            <Input
              id="username"
              autocomplete={"on"}
              bind:value={userDetail.username}
              placeholder={userDetail.type == "STUDENT"
                ? "Student regno"
                : "Username"}
            />
            <p
              class="text-sm font-medium text-red-600 {!userDetailErrorMessage.username &&
                'hidden'}"
            >
              {userDetailErrorMessage.username}
            </p>
          </div>
          <div class="flex flex-col space-y-1.5">
            <Label
              class={userDetailErrorMessage.password && "text-red-600"}
              for="password">Password</Label
            >
            <Input
              id="password"
              bind:value={userDetail.password}
              type="password"
              placeholder="Password"
            />
            <p
              class="text-sm font-medium text-red-600 {!userDetailErrorMessage.password &&
                'hidden'}"
            >
              {userDetailErrorMessage.password}
            </p>
          </div>
        </div>
      </form>
    </Card.Content>
    <Card.Footer>
      <Button disabled={requestOngoing} class="w-full" on:click={onContinue}>
        <LoaderCircle
          class="mr-2 h-4 w-4 animate-spin {!requestOngoing && 'hidden'}"
        />
        {!requestOngoing ? "Continue" : "Please wait"}
      </Button>
    </Card.Footer>
  </Card.Root>
</main>
