<script lang="ts">
  import { Button } from "@/components/ui/button";
  import { verifyFace } from "@/service";
  import { dataURLtoBlob, showDialogToast } from "@/utils";
  import { Camera, XIcon, LoaderCircle } from "lucide-svelte/icons";
  import { onDestroy, createEventDispatcher } from "svelte";

  export let accessToken: string;

  export async function recognize() {
    open = true;
    await startWebcam();
  }

  function close() {
    stopWebcam();
    snapshotDataURL = null;
    open = false;
  }

  function onExit() {
    close();
    dispatch("exit");
    showDialogToast("ERROR", "Request failed", "Facial recognition cancelled");
  }

  async function startWebcam() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      videoElement.srcObject = stream;
      videoElement.play();
      videoElement.onloadeddata = () => {
        mediaShowing = true;
      };
    } catch (e) {
      close();
      dispatch("exit");
      if (e instanceof DOMException) {
        if (e.name === "NotAllowedError") {
          showDialogToast(
            "ERROR",
            "Request failed",
            "User denied access to media devices"
          );
        } else if (e.name === "NotFoundError") {
          showDialogToast("ERROR", "Request failed", "No media device found");
        } else if (e.name === "NotReadableError") {
          showDialogToast(
            "ERROR",
            "Request failed",
            "Media device is already in use."
          );
        } else if (e.name === "OverconstrainedError") {
          showDialogToast(
            "ERROR",
            "Request failed",
            "Constraints not met by available devices"
          );
        } else if (e.name === "SecurityError") {
          showDialogToast(
            "ERROR",
            "Request failed",
            "Access to media devices blocked for security reasons"
          );
        } else if (e.name === "TypeError") {
          showDialogToast(
            "ERROR",
            "Request failed",
            "Invalid constraints provided"
          );
        }
      }
    }
  }

  async function onSnap() {
    requestOngoing = true;
    snapshotDataURL = takeSnapshot();
    stopWebcam();
    let faceImage = dataURLtoBlob(snapshotDataURL);

    let serviceRequest = await verifyFace({
      accessToken: accessToken,
      faceImage,
    });

    if (serviceRequest.error) {
      showDialogToast("ERROR", "Request failed", serviceRequest.error.message);
    } else {
      dispatch("successful");
    }

    requestOngoing = false;
    close();
  }

  function takeSnapshot() {
    const context = canvasElement.getContext("2d") as CanvasRenderingContext2D;
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    context.drawImage(
      videoElement,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );
    return canvasElement.toDataURL("image/jpg", 0.9);
  }

  function stopWebcam() {
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      mediaShowing = false;
      stream = null;
    }
  }

  let open = false;
  let mediaShowing = false;
  let stream: MediaStream | null;
  let requestOngoing: boolean = false;
  let videoElement: HTMLVideoElement;
  let canvasElement: HTMLCanvasElement;
  let dispatch = createEventDispatcher();
  let snapshotDataURL: string | null = null;

  onDestroy(() => {
    stopWebcam();
  });
</script>

<main
  class="fixed w-full h-full left-0 top-0 justify-center items-center z-50 {open
    ? 'block'
    : 'hidden'}"
>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <section
    on:click={onExit}
    class="w-full h-full bg-background/80 backdrop-blur-sm"
  ></section>
  <section
    class="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] flex-col gap-4 justify-center items-center flex"
  >
    <p class="text-lg">Facial authentication</p>
    <!-- svelte-ignore a11y-media-has-caption -->
    <video
      class=" w-[360px] rounded-lg {mediaShowing && !requestOngoing
        ? 'flex'
        : 'hidden'}"
      bind:this={videoElement}
      autoplay
      playsinline
    ></video>
    <canvas bind:this={canvasElement} class="hidden"></canvas>
    <div
      style={snapshotDataURL && `background-image: url('${snapshotDataURL}');`}
      class="justify-center items-center h-[160px] w-[360px] md:h-[270px] bg-no-repeat bg-contain bg-center {!mediaShowing ||
      requestOngoing
        ? 'flex'
        : 'hidden'} {snapshotDataURL && 'backdrop-blur-sm'}"
    >
      <LoaderCircle class="animate-spin h-20 w-20" />
    </div>
    <div class="flex justify-center items-center gap-4 m-2 pl-12">
      <Button
        disabled={!mediaShowing || requestOngoing}
        size="icon"
        class="rounded-full h-12 w-12"
        on:click={onSnap}
      >
        <Camera class="h-8 w-8" />
      </Button>
      <Button
        disabled={!mediaShowing || requestOngoing}
        variant="outline"
        size="icon"
        class="rounded-full h-9 w-9"
        on:click={onExit}
      >
        <XIcon class="h-6 w-6" />
      </Button>
    </div>
  </section>
</main>
