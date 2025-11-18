export default function About(){
  const founders=[
    {name:'Mellyana',photo:'/images/founders/Mellyana.jpg'},
    {name:'Naya',photo:'/images/founders/Naya.jpg'},
    {name:'Adel',photo:'/images/founders/Adel.jpg'},
    {name:'Hazqie',photo:'/images/founders/Hazqie.png'},
    {name:'Luqman',photo:'/images/founders/noe.jpg'},
    {name:'Dito',photo:'/images/founders/Dito.jpeg'},
  ]
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="wp-h2 text-center">Tentang SeCon-D</h1>
      <p className="text-center text-slate-600 dark:text-slate-300 mt-3 max-w-2xl mx-auto">
        SeCon-D dibuat untuk memudahkan Anda menemukan layanan harian terbaik di sekitar Anda.
      </p>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mt-10">
        {founders.map((f,i)=>(
          <div key={i} className="card flex flex-col items-center text-center p-4">
            <img src={f.photo} className="w-28 h-28 object-cover rounded-full shadow mb-4"/>
            <div className="font-semibold text-lg">{f.name}</div>
            <div className="text-sm text-slate-500">{f.role}</div>
          </div>
        ))}
      </div>
    </div>
  )
}