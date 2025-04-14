export const metadata = {
    title: "Waiting Users Dashboard",
    description: "View users waiting in chatrooms",
  }
  
  export default function WaitingUsersLayout({ children }) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main>{children}</main>
      </div>
    )
  }
  