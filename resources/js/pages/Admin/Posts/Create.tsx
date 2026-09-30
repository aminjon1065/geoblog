import { PostEditor } from '@/components/posts/post-editor';
import type { PostEditorProps } from '@/components/posts/types';

export default function PostsCreate(props: PostEditorProps) {
    return <PostEditor {...props} post={null} />;
}
