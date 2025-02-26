"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link'
 

export default function Home() {
  return (
    <div>
      <h1>Hey</h1>
      <button>Classroom Page</button>
      <Link href="classroomManagement/">Dashboard</Link>
    </div>
  );
}

// function ClassroomManagementButton() {
//   const [mounted, setMounted] = useState(false);
//   const router = useRouter();

//   // This useEffect ensures that the router is only used on the client-side
//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   const handleClick = () => {
//     router.push('/classroomManagement');  // Navigate to the classroom management page
//   };

//   if (!mounted) {
//     return null;  // Return null until the component is mounted (to avoid SSR issues)
//   }

//   return <button onClick={handleClick}>Classroom</button>;
// }
