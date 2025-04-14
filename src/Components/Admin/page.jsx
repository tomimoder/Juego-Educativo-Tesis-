"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Clock, Users } from "lucide-react";
import { io } from "socket.io-client";

export default function DashboardPage() {
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // IP de tu backend Socket.io
  const VITE_API_URL = "http://192.168.7.203:3001";

  const formatTimeAgo = (date) => {
    const now = new Date();
    const waitingDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - waitingDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes === 1) return "1 minute ago";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return "1 hour ago";
    return `${diffInHours} hours ago`;
  };

  useEffect(() => {
    // Conectar a socket.io
    const socket = io(VITE_API_URL);

    socket.on("connect", () => {
      console.log("✅ Conectado a Socket.io");
    });

    // Recibir actualizaciones de usuarios en espera
    socket.on("waitingUserUpdate", (updatedUsers) => {
      setWaitingUsers(updatedUsers);
      setLoading(false);
    });

    // Recibir actualizaciones de grupos
    socket.on("groupsUpdate", (updatedGroups) => {
      setGroups(updatedGroups);
      setLoading(false);
    });

    socket.on("disconnect", () => {
      console.log("❌ Desconectado de Socket.io");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Chatroom Dashboard</h1>

      {/* Sección de Usuarios en Espera */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Waiting Users</h2>
        {waitingUsers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No users waiting</h3>
            <p className="mt-2 text-gray-500">All users are currently paired in chatrooms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {waitingUsers.map((user) => (
              <WaitingUserCard key={user.waitingUserId} user={user} formatTimeAgo={formatTimeAgo} />
            ))}
          </div>
        )}
      </section>

      {/* Sección de Grupos Activos */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Active Groups</h2>
        {groups.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No active groups</h3>
            <p className="mt-2 text-gray-500">There are no active chat groups at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <GroupCard key={group.chatGroupId} group={group} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function WaitingUserCard({ user, formatTimeAgo }) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="bg-gray-50 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Chatroom Pending</CardTitle>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Waiting
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700">Waiting User</h3>
            <p className="text-gray-900 font-semibold">{user.waitingUserName}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-700">Waiting For</h3>
            <p className="text-gray-900 font-semibold">
              Any user with level {user.nivel_curso}
            </p>
          </div>

          <div className="flex justify-between items-center pt-2 text-sm">
            <div className="flex items-center text-gray-500">
              <Badge variant="secondary" className="mr-2">
                {user.nivel_curso}
              </Badge>
              Level
            </div>
            <div className="flex items-center text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              {formatTimeAgo(user.waitingSince)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GroupCard({ group }) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="bg-gray-50 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Chatroom {group.chatGroupId}</CardTitle>
          <Badge
            variant="outline"
            className={
              group.status === "connected"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-yellow-50 text-yellow-700 border-yellow-200"
            }
          >
            {group.status === "connected" ? "Connected" : "Waiting"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700">Users</h3>
            <ul className="text-gray-900 font-semibold">
              {group.users.map((user) => (
                <li key={user.userId}>
                  {user.name} (Level {user.current_level_id || "N/A"})
                </li>
              ))}
            </ul>
          </div>

          {group.status === "waiting" && (
            <div>
              <h3 className="font-medium text-gray-700">Waiting Status</h3>
              <p className="text-gray-900 font-semibold">{group.waitingDetails}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}