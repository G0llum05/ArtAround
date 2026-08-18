import { ArtworkResponse } from "./artwork.model";
import { ImageSchema } from "./subModels/image.model";

export interface ArtistResponse {
    id: string;
    name: string;
    surname: string;
    artworks?: (ArtworkResponse | string)[];
    artisticCurrents?: string[];
    artisitcCurrents?: string[];
    followerOf?: (ArtistResponse | string)[] | ArtistResponse | string;
    teacherOf?: (ArtistResponse | string)[] | ArtistResponse | string;
    assets?: {
        images: ImageSchema[];
    };
}

export interface ArtistRequest {
    name: string;
    surname: string;
    artworks?: (ArtworkResponse | string)[];
    artisticCurrents?: string[];
    artisitcCurrents?: string[];
    followerOf?: (ArtistResponse | string)[] | ArtistResponse | string;
    teacherOf?: (ArtistResponse | string)[] | ArtistResponse | string;
    assets?: {
        images: ImageSchema[];
    };
}