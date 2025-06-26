import React, { useState, useEffect } from "react";

const Todo = ({ todos, onDelete, onEdit }) => {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {todos === null || todos.length === 0 ? (
          <p className="text-center text-gray-500">No todos available.</p>
        ) : (
          <ul className="space-y-4">
            {todos?.map((todo) => (
              <li
                key={todo.id}
                className="border border-gray-200 rounded-lg shadow-sm p-6 bg-white hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-black">
                      {todo.tag}
                    </h3>
                    <p className="text-gray-800 mt-2">{todo.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Date: {todo.date.split("T")[0]} | User: {todo.user}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() =>
                        onEdit(todo.id, {
                          tag: "Updated Tag",
                          description: "Updated Description",
                        })
                      }
                      className="text-white bg-black hover:bg-gray-800 px-4 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(todo.id)}
                      className="text-black border border-black hover:bg-black hover:text-white px-4 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Todo;
