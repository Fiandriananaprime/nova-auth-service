import type { RegisterRequest  } from "@Fiandriananaprime/nova_api_type"

export type createUserDto = RegisterRequest & {
    id: string,
}
export type {RegisterRequest}

