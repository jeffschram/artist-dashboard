export const PERSON_TYPES = [
  "Venue Contact",
  "Colleague",
  "Artist",
  "Client",
  "Patron",
  "Customer",
  "Agent",
  "Vendor",
  "Other",
] as const;

export type PersonType = typeof PERSON_TYPES[number];

export function getPersonTypeBadgeClass(type: string) {
  switch (type) {
    case "Venue Contact":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "Colleague":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "Artist":
      return "bg-purple-100 text-purple-800 hover:bg-purple-100";
    case "Client":
      return "bg-teal-100 text-teal-800 hover:bg-teal-100";
    case "Patron":
      return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100";
    case "Customer":
      return "bg-cyan-100 text-cyan-800 hover:bg-cyan-100";
    case "Agent":
      return "bg-orange-100 text-orange-800 hover:bg-orange-100";
    case "Vendor":
      return "bg-pink-100 text-pink-800 hover:bg-pink-100";
    case "Other":
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
}
