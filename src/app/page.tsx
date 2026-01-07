"use client"

import { useMutation, useQuery } from "convex/react";

import { Button } from "@/components/ui/button";

import { api } from "../../convex/_generated/api";

export default function Home() {

  const projects = useQuery(api.projects.get)
  const createProject = useMutation(api.projects.create)
  return (
    <div className="flex flex-col gap-2">
      <Button
       onClick={()=> createProject({
        name:"Project 2"
       })}
      >
        Create Project
      </Button>
      {projects?.map((project)=>(
        <div
        className="border rounded p-2 flex-col"
        key={project._id}>
          <p> {project.name}</p>
          <p> owner Id : {project.ownerId}</p>
        </div>
      ))}
    </div>
  )

}
