import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";
import { Doc, Id } from "../convex/_generated/dataModel";

export const getFiles = query({
    args: { projectId: v.id("projects") },
    handler: async (ctx, args) => {

        const identity = await verifyAuth(ctx)

        const project = await ctx.db.get("projects", args.projectId)
        if (!project) {
            throw new Error("Project not found");
        }
        if (project.ownerId !== identity.subject) {
            throw new Error("Unauthorized to access this project");
        }
        return await ctx.db
            .query("files")
            .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
            .collect();
    },
});

export const getFile = query({
    args: { id: v.id("files") },
    handler: async (ctx, args) => {

        const identity = await verifyAuth(ctx)

        const file = await ctx.db.get("files", args.id)
        if (!file) {
            throw new Error("File not found");
        }

        const project = await ctx.db.get("projects", file.projectId)
        if (!project) {
            throw new Error("Project not found");
        }
        if (project.ownerId !== identity.subject) {
            throw new Error("Unauthorized to access this project");
        }
        return file;
    },
});

export const getFilePath = query({
    args: {
        id: v.id("files")
    },
    handler: async (ctx, args) => {

        const identity = await verifyAuth(ctx)

        const file = await ctx.db.get("files", args.id)
        if (!file) {
            throw new Error("File does not exist")
        }

        const project = await ctx.db.get("projects", file.projectId)
        if (!project) {
            throw new Error("Project not found");
        }
        if (project.ownerId !== identity.subject) {
            throw new Error("Unauthorized to access this project");
        }

        const path: { _id: string; name: string }[] = [];
        let currentId: Id<"files"> | undefined = args.id;

        while (currentId) {
            const file = (await ctx.db.get("files", currentId)) as
                | Doc<'files'>
                | undefined;
            if (!file) break;

            path.unshift({ _id: file._id, name: file.name })
            currentId = file.parentId;
        }

        return path;
    }
});

export const getFolderContents = query({
    args: {
        projectId: v.id("projects"),
        parentId: v.optional(v.id("files"))
    },
    handler: async (ctx, args) => {

        const identity = await verifyAuth(ctx)

        const project = await ctx.db.get("projects", args.projectId)
        if (!project) {
            throw new Error("Project not found");
        }
        if (project.ownerId !== identity.subject) {
            throw new Error("Unauthorized to access this project");
        }

        const files = await ctx.db
            .query("files")
            .withIndex("by_project_parent", (q) => q
                .eq("projectId", args.projectId)
                .eq("parentId", args.parentId)
            )
            .collect();

        //sort folders first, then files, both alphabetically within each group
        return files.sort((a, b) => {
            //folders come before files
            if (a.type === "folder" && b.type === "file") return -1;
            if (a.type === "file" && b.type === "folder") return 1;

            //within sale type sort alphabetically by name 
            return a.name.localeCompare(b.name);
        });
    }
});

export const createFile = mutation({
    args: {
        projectId: v.id("projects"),
        parentId: v.optional(v.id("files")),
        name: v.string(),
        content: v.string(),
    },
    handler: async (ctx, args) => {

        const identity = await verifyAuth(ctx)

        const project = await ctx.db.get("projects", args.projectId)
        if (!project) {
            throw new Error("Project not found");
        }
        if (project.ownerId !== identity.subject) {
            throw new Error("Unauthorized to access this project");
        }

        //check if same name file exists in the parent folder
        const files = await ctx.db
            .query("files")
            .withIndex("by_project_parent", (q) => q
                .eq("projectId", args.projectId)
                .eq("parentId", args.parentId)
            )
            .collect();

        const existingFile = files.find(f => f.name === args.name && f.type === "file");
        if (existingFile) throw new Error("File already exists");

        await ctx.db.insert("files", {
            projectId: args.projectId,
            parentId: args.parentId,
            name: args.name,
            content: args.content,
            type: "file",
            updatedAt: Date.now(),
        });

        await ctx.db.patch("projects", args.projectId, {
            updatedAt: Date.now(),
        });
    }
});

export const createFolder = mutation({
    args: {
        projectId: v.id("projects"),
        parentId: v.optional(v.id("files")),
        name: v.string(),
    },
    handler: async (ctx, args) => {

        const identity = await verifyAuth(ctx)

        const project = await ctx.db.get("projects", args.projectId)
        if (!project) {
            throw new Error("Project not found");
        }
        if (project.ownerId !== identity.subject) {
            throw new Error("Unauthorized to access this project");
        }

        //check if same name folder exists in the parent folder
        const files = await ctx.db
            .query("files")
            .withIndex("by_project_parent", (q) => q
                .eq("projectId", args.projectId)
                .eq("parentId", args.parentId)
            )
            .collect();

        const existingFolder = files.find(f => f.name === args.name && f.type === "folder");
        if (existingFolder) throw new Error("Folder already exists");

        await ctx.db.insert("files", {
            projectId: args.projectId,
            parentId: args.parentId,
            name: args.name,
            type: "folder",
            updatedAt: Date.now(),
        });

        await ctx.db.patch("projects", args.projectId, {
            updatedAt: Date.now(),
        });
    }
});

export const renameFile = mutation({
    args: {
        id: v.id("files"),
        newName: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx)

        const file = await ctx.db.get("files", args.id)
        if (!file) throw new Error("File not found");

        const project = await ctx.db.get("projects", file.projectId)
        if (!project) throw new Error("Project not found");
        if (project.ownerId !== identity.subject) {
            throw new Error("Unauthorized to access this project");
        }

        //check if same name file exists in the parent folder
        const siblings = await ctx.db
            .query("files")
            .withIndex("by_project_parent", (q) => q
                .eq("projectId", file.projectId)
                .eq("parentId", file.parentId)
            )
            .collect();

        const existingSiblings = siblings.find(
            s =>
                s.name === args.newName &&
                s.type === s.type &&
                s._id !== args.id
        );
        if (existingSiblings) throw new Error(`A ${file.type} with this name already exists in this location`);

        //update file's name
        await ctx.db.patch("files", args.id, {
            name: args.newName,
            updatedAt: Date.now(),
        });

        await ctx.db.patch("projects", file.projectId, {
            updatedAt: Date.now(),
        });
    }
});

export const deleteFile = mutation({
    args: {
        id: v.id("files"),
    },
    handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx)

        const file = await ctx.db.get("files", args.id)
        if (!file) throw new Error("File not found");

        const project = await ctx.db.get("projects", file.projectId)
        if (!project) throw new Error("Project not found");
        if (project.ownerId !== identity.subject) {
            throw new Error("Unauthorized to access this project");
        }

        //Recursively delete file/folder and decendents
        const deleteRecursive = async (fileId: Id<"files">) => {
            const item = await ctx.db.get("files", fileId)
            if (!item) return;

            //if folder, delete children first
            if (item.type === "folder") {
                const children = await ctx.db
                    .query("files")
                    .withIndex("by_project_parent", (q) => q
                        .eq("projectId", item.projectId)
                        .eq("parentId", fileId))
                    .collect();
                for (const child of children) {
                    await deleteRecursive(child._id);
                }
            }

            //delete storage file if it exists
            if (item.storageId) {
                await ctx.storage.delete(item.storageId);
            }

            // delete the file/folder itself
            await ctx.db.delete("files", fileId);
        };

        await deleteRecursive(args.id);

        await ctx.db.patch("projects", file.projectId, {
            updatedAt: Date.now(),
        });
    }
});

export const updateFileContent = mutation({
    args: {
        id: v.id("files"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await verifyAuth(ctx);

        const file = await ctx.db.get("files", args.id)
        if (!file) throw new Error("File not found");

        const project = await ctx.db.get("projects", file.projectId)
        if (!project) throw new Error("Project not found");
        if (project.ownerId !== identity.subject) {
            throw new Error("Unauthorized to access this project");
        }

        const now = Date.now();
        await ctx.db.patch("files", args.id, {
            content: args.content,
            updatedAt: now,
        });

        await ctx.db.patch("projects", file.projectId, {
            updatedAt: now,
        });
    }
})