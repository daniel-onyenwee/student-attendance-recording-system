export default async function getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        window.navigator.geolocation.getCurrentPosition(
            (data) => resolve(data),
            (error) => reject(error),
            { enableHighAccuracy: true }
        );
    })
}