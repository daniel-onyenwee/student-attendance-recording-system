export default async function watchPosition(cb: (position: GeolocationPosition) => void): Promise<number> {
    return new Promise((resolve, reject) => {
        let id = window.navigator.geolocation.watchPosition(
            cb,
            (error) => reject(error),
            { enableHighAccuracy: true, timeout: 5000 }
        );
        resolve(id)
    })
}