// import darkLogo from "@/assets/logos/dark.svg";
// import logo from "@/assets/logos/main.svg";
// import Image from "next/image";

// export function Logo() {
//   return (
//     <div className="relative h-8 max-w-[10.847rem]">
//       <Image
//         src={logo}
//         fill
//         className="dark:hidden"
//         alt="Paridhan"
//         role="presentation"
//         quality={100}
//       />

//       <Image
//         src={darkLogo}
//         fill
//         className="hidden dark:block"
//         alt="Paridhan"
//         role="presentation"
//         quality={100}
//       />
//     </div>
//   );
// }


export function Logo() {
  return (
    <div className="relative flex h-8 items-center select-none">
      {/* Light mode */}
      <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:hidden">
        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Paridhan
        </span>
      </span>

      <span className="hidden text-xl font-extrabold tracking-tight dark:block">
        <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Paridhan
        </span>
      </span>
    </div>
  );
}