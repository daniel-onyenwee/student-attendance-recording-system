import { $Enums, ClassLocation as ClassLocationModel } from "@prisma/client"

type ClassLocation = Omit<ClassLocationModel, "id" | "classAttendanceId" | "createdAt" | "updatedAt" | "metadata">

interface GeolocationCoordinate {
    latitude: number
    longitude: number
}

interface BoxBoundary {
    north: number
    south: number
    east: number
    west: number
}

const ExtraSmallClassSizeInMetre = 50

const toRad = (x: number) => x * Math.PI / 180

function classSizeInMetre(size: $Enums.ClassSize): number {
    if (size == $Enums.ClassSize.EXTRA_LARGE) {
        return ExtraSmallClassSizeInMetre * 2
    } else if (size == $Enums.ClassSize.LARGE) {
        return ExtraSmallClassSizeInMetre * 4
    } else if (size == $Enums.ClassSize.MEDIUM) {
        return ExtraSmallClassSizeInMetre * 3
    } else if (size == $Enums.ClassSize.SMALL) {
        return ExtraSmallClassSizeInMetre * 2
    } else {
        return ExtraSmallClassSizeInMetre
    }
}

function squareHallBoundary(sideLength: number, coordinate: GeolocationCoordinate): BoxBoundary {
    const halfSide = sideLength / 2
    const metersToDegrees = 0.00001
    return {
        north: coordinate.latitude + halfSide * metersToDegrees,
        south: coordinate.latitude - halfSide * metersToDegrees,
        east: coordinate.longitude + halfSide * metersToDegrees,
        west: coordinate.longitude - halfSide * metersToDegrees
    }
}

function withinBoundary(boundary: BoxBoundary, coordinate: GeolocationCoordinate) {
    const { latitude, longitude } = coordinate

    return latitude <= boundary.north &&
        latitude >= boundary.south &&
        longitude <= boundary.east &&
        longitude >= boundary.west
}

function haversineDistance(coordinate1: GeolocationCoordinate, coordinate2: GeolocationCoordinate): number {
    const R = 6371e3 // Earth’s mean radius in meters
    const dLat = toRad(coordinate2.latitude - coordinate1.latitude)
    const dLng = toRad(coordinate2.longitude - coordinate1.longitude)
    const lat1 = toRad(coordinate1.latitude)
    const lat2 = toRad(coordinate2.latitude)

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export default function isStudentInsideClassroom(studentLocation: GeolocationCoordinate, classLocation: ClassLocation): boolean {
    let classCoordinate: GeolocationCoordinate = {
        latitude: classLocation.latitude.toNumber(),
        longitude: classLocation.longitude.toNumber()
    }

    if (classLocation.classShape == $Enums.ClassShape.SQUARE) {
        return withinBoundary(squareHallBoundary(classSizeInMetre(classLocation.classSize), classCoordinate), studentLocation)
    } else {
        return haversineDistance(studentLocation, classCoordinate) <= classSizeInMetre(classLocation.classSize)
    }
}