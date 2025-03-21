import { Skeleton } from '@/components/ui/skeleton'
import { useMovies } from '@/hooks/useMovies'
import { useDebounceValue } from 'usehooks-ts'
import { Input } from '@/components/ui/input'
import { SearchResult } from './SearchResult'
import { useEffect, useState } from 'react'
import { Pagination } from './Pagination'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { SEARCH_DEBOUNCE_DELAY } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { queryClient } from '@/config/query'
import { getMovieDetail } from '@/hooks/useMovieDetail'

export const MovieSearch = () => {
  const navigate = useNavigate()
  const searchParameters = useSearch({ from: ROUTES.HOME })

  const [searchValue, setSearchValue] = useState(searchParameters.search ?? '')
  const [page, setPage] = useState(Number(searchParameters.page ?? 1))
  const [debouncedSearchValue] = useDebounceValue(
    searchValue,
    SEARCH_DEBOUNCE_DELAY,
  )
  const { data, error, isError, isPending } = useMovies(
    debouncedSearchValue,
    page,
  )

  const noSearchValue = debouncedSearchValue.trim().length === 0

  useEffect(() => {
    if (!data?.results || data.results.length === 0) return

    // Prefetch details for each movie in the search results
    data.results.forEach((movie) => {
      queryClient.prefetchQuery({
        queryKey: ['movie', movie.id],
        queryFn: () => getMovieDetail(movie.id.toString()),
        staleTime: 10 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
      })
    })
  }, [data])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    navigate({
      to: ROUTES.HOME,
      search: { ...searchParameters, page: newPage },
    })
  }

  const handleSearchValueChange = (value: string) => {
    setSearchValue(value)
    setPage(1)
    navigate({ to: ROUTES.HOME, search: { search: value, page: 1 } })
  }

  if (isError) {
    throw error
  }

  const renderContent = () => {
    if (isPending) {
      return <Skeleton className="h-96" />
    }

    if (noSearchValue) {
      return (
        <div className="flex justify-center items-center mt-8 text-center text-xl text-gray-600">
          Enter a movie title to search
        </div>
      )
    }

    return (
      <>
        <SearchResult movies={data.results} />
        {data.results.length > 0 && (
          <Pagination
            page={page}
            setPage={handlePageChange}
            totalPages={data.total_pages}
          />
        )}
      </>
    )
  }

  return (
    <div className="w-full mx-auto px-4 py-8 min-h-screen">
      <header className="mb-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-center mb-8">
          TMDB Movie Search
        </h1>
        <Input
          value={searchValue}
          onChange={(e) => handleSearchValueChange(e.target.value)}
          type="text"
          placeholder="Search movie"
          autoFocus
          className="w-2/3"
          aria-label="Search movie"
        />
      </header>
      {renderContent()}
    </div>
  )
}
