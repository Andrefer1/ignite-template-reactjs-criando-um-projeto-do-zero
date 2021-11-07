import { useEffect, useState } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import readingTime from 'reading-time/lib/reading-time';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

interface GSProps {
  props: {
    post: Post;
  };
}

export default function Post({ post }: PostProps): JSX.Element {
  const [minutesLecture, setMinutesLecture] = useState<number>(0);
  const router = useRouter();

  if (router.isFallback) {
    return <h6>Carregando...</h6>;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const text = post.data.content.map(content =>
      content.body.map(e => e.text).join()
    );

    const allText = text.map(e => e).join();

    const { minutes } = readingTime(allText);

    const [min, sec] = String(minutes).split('.');

    const totalMin = Number(sec) === 0 ? Number(min) : Number(min) + 2;

    setMinutesLecture(totalMin);
  }, [post.data.content]);

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>

      <div className={commonStyles.container}>
        <div className={styles.content}>
          <Image
            className={styles.banner}
            src={post.data.banner.url}
            alt="Imagem do post"
            // layout="fill"
            width={1280}
            height={600}
            objectFit="scale-down"
          />

          <header>
            <h1>{post.data.title}</h1>
            <div>
              <div>
                <FiCalendar />
                <time>
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </time>
              </div>
              <div>
                <FiUser />
                <p>{post.data.author}</p>
              </div>
              <div>
                <FiClock />
                <time>{minutesLecture} min</time>
              </div>
            </div>
          </header>

          {post.data.content.map(content => (
            <div key={content.heading} className={styles.textContent}>
              <h2>{content.heading}</h2>
              <div
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: content.body.map(e => e.text).join('<br /><br />'),
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query('', {
    fetch: ['post.slug'],
  });

  const paths = posts.results.map(post => ({
    params: { slug: post.uid.toString() },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
}): Promise<GSProps> => {
  const { slug } = params;

  const prismic = getPrismicClient();
  // eslint-disable-next-line testing-library/no-await-sync-query
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(
        (content: { heading: string; body: [] }) => ({
          heading: content.heading,
          body: content.body,
        })
      ),
    },
  };

  return {
    props: { post },
  };
};
