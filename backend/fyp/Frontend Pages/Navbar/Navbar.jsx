import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <div className="bg-green-600 text-white p-4 flex justify-between">
      <h1 className="text-2xl font-bold">Kotha Cha</h1>

      <div className="space-x-4">
        <Link to="/">Home</Link>
        <Link to="/rooms">Rooms</Link>
        <Link to="/login">Login</Link>
      </div>
    </div>
  )
}

export default Navbar
