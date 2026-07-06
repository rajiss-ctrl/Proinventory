import Spinner from "../../assets/img/loading-state.svg?url";

const LoadingSpinner = () => (
  <div className="h-screen flex flex-col justify-center items-center">
    <img className="w-20" src={Spinner} alt="Loading…" />
  </div>
);

export default LoadingSpinner;
