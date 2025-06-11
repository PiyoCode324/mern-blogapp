import { Link } from 'react-router-dom'
import Image from './Image'

const PostListItem = () => {
  return (
    <div className='flex flex=col xl:flex-row gap-8'>
        {/* image */}
        <div className="md:hidden xl:block xl:w-1/3">
            <Image src="postImg.jpeg" className="rounded-2xl object-cover" w="735"/>
        </div>
        {/* details */}
        <div className="flex flex-col gap-4">
            <Link to="/test" className='text4xl font-semibold'>
                Lorem ipsum dolor, sit amet consectetur adipisicing elit. Molestias non ipsum corrupti.
            </Link>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
                <span>Written by</span>
                <Link className='text-blue-800'>John Doe</Link>
                <span>on</span>
                <Link className='text-blue-800'>Web Design</Link>
                <span>2 days ago</span>
            </div>
            <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Non eligendi officia necessitatibus, sed odit suscipit tempora dolor dicta, quasi ipsa velit totam aspernatur! Sed, temporibus. Maiores nobis praesentium iure facilis.
            </p>
            <Link to="/test" className='underline text-blue-800 text-sm'>Read More</Link>
        </div>
    </div>
  )
}

export default PostListItem