const FooterSimple = () => (
  <footer className="py-4 text-white bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
    <div className="container mx-auto px-4">
      <hr className="mb-4 border-white/50" />
      <div className="flex flex-wrap items-center md:justify-between justify-center gap-2">
        <p className="text-sm text-center">
          &copy; {new Date().getFullYear()}{" "}
          <a href="https://github.com/rajiss-ctrl" className="hover:text-yellow-300">
            HackyRaji
          </a>
        </p>
        <ul className="flex gap-4 list-none">
          <li>
            <a href="https://github.com/rajiss-ctrl" className="text-yellow-300 hover:text-white text-sm">
              HackyRaji
            </a>
          </li>
          <li>
            <a href="#about" className="text-yellow-300 hover:text-white text-sm">
              About
            </a>
          </li>
        </ul>
      </div>
    </div>
  </footer>
);

export default FooterSimple;
