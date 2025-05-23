import express from "express";
import request from "supertest";
import cookieParser from "cookie-parser";
import {beforeAll, beforeEach, describe, expect, it} from "@jest/globals";
import {userRoute} from "../../src/routes/userRoutes";
import {createMockUser, MockUser} from "../../__mocks__/mockUsersRoute";
import {deleteUserById, getUserById} from "../../src/controllers/userController";
import {getSignedTestJWT, JWT_SECRET} from "../../__mocks__/getSignedTestJWT";
import { authMiddleware } from "../../src/middleware/authMiddleware"

jest.mock("../../src/controllers/userController", () => {
    return {
        getUserById: jest.fn(),
        deleteUserById: jest.fn(),
    };
});

let app: express.Express;

beforeAll(() => {
    app = express();
    app.use(cookieParser());
    app.use(express.json());
    app.use("/users", authMiddleware, userRoute);
});

describe("GET /users/me", () => {
    process.env.JWT_SECRET = JWT_SECRET;
    let mockUser: MockUser;
    let token: string;

    beforeEach(() => {
        mockUser = createMockUser();
        token = getSignedTestJWT(mockUser);

        (getUserById as jest.Mock).mockResolvedValue(mockUser);
        (deleteUserById as jest.Mock).mockResolvedValue(mockUser);

    });

    it("should return 200 and user data", async () => {
        const res = await request(app)
            .get("/users/me")
            .set("Cookie", [`token=${token}`]);

        expect(res.status).toBe(200);

        expect(res.body.user).toMatchObject({
            id: mockUser.id,
            email: mockUser.email,
            displayName: mockUser.displayName,
            imageUrl: mockUser.imageUrl,
            createdAt: mockUser.createdAt.toISOString(),
        });
    });

    it("should return 401 if token is missing", async () => {
        const res = await request(app).get("/users/me");

        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Token not provided");
    });

    it("should return 404 if user is not found during auth", async () => {
        (getUserById as jest.Mock).mockResolvedValue(null);

        const res = await request(app)
            .get("/users/me")
            .set("Cookie", [`token=${token}`]);

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("User not found");
    });

    it("should return 401 if token is invalid", async () => {
        const originalConsoleError = console.error;
        console.error = jest.fn();

        const res = await request(app)
            .get("/users/me")
            .set("Cookie", [`token=invalid.jwt.token`]);

        expect(res.status).toBe(401);
        expect(res.body.error).toBe("Access denied");

        console.error = originalConsoleError; // restore after test
    });

    it("should return 404 if user is not found after auth", async () => {
        (getUserById as jest.Mock).mockResolvedValue(null);

        const res = await request(app)
            .get("/users/me")
            .set("Cookie", [`token=${token}`]);

        expect(res.status).toBe(404);
        expect(res.body.error).toBe("User not found");
    });
    it("should delete the user and return 204", async () => {
        const res = await request(app)
            .delete("/users/me")
            .set("Cookie", [`token=${token}`]);
        expect(res.status).toBe(204);
        expect(deleteUserById).toHaveBeenCalledWith(mockUser.id);
    });

    it("should return 404 if user not found", async () => {
        (getUserById as jest.Mock).mockResolvedValue(null);
        const res = await request(app)
            .delete("/users/me")
            .set("Cookie", [`token=${token}`]);
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("User not found");
    });

    it("should return 401 if token is missing", async () => {
        const res = await request(app).delete("/users/me");
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("Token not provided");
    });

    it("should return 404 if user not found during auth", async () => {
        (getUserById as jest.Mock).mockResolvedValue(null);
        const res = await request(app)
            .delete("/users/me")
            .set("Cookie", [`token=${token}`]);
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("User not found");
    });

    it("should return 500 if delete throws", async () => {
        console.error = jest.fn();
        (deleteUserById as jest.Mock).mockRejectedValue(new Error("DB error"));
        const res = await request(app)
            .delete("/users/me")
            .set("Cookie", [`token=${token}`]);
        expect(res.status).toBe(500);
        expect(res.body.error).toBe("Internal server error");
    });

});
