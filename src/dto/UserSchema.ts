import type { UserRole } from "@Fiandriananaprime/nova_api_type"
export type { RegisterRequest} from "@Fiandriananaprime/nova_api_type"
export type createUserDto = {
    id: string,
    role: UserRole
    email: string,
    password: string
}

