export default async function getCurrentLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        window.navigator.geolocation.getCurrentPosition(
            (data) => resolve(data),
            (error) => reject(error),
            { enableHighAccuracy: true }
        );
    })
}