const Home = () => {
  return (
    <div>
      <div className="bg-[url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2')] h-screen bg-cover bg-center flex items-center justify-center">
        <div className="bg-black/60 p-10 rounded-xl text-white text-center">
          <h1 className="text-5xl font-bold mb-4">
            Find Rooms Anywhere in Nepal
          </h1>

          <p className="text-lg mb-5">
            Easy booking with eSewa payment
          </p>

          <button className="bg-green-500 px-6 py-3 rounded-lg">
            Explore Rooms
          </button>
        </div>
      </div>
    </div>
  )
}

export default Home
